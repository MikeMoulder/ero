import * as StellarSdk from '@stellar/stellar-sdk';
import { AgentWallet } from '../types';
import { walletStore } from '../store/wallet.store';
import { encrypt, decrypt } from '../utils/crypto';
import { stellarService } from './stellar.service';
import { events } from './events.service';

class AgentWalletService {
  // Simple per-key mutex to prevent concurrent getOrCreateWallet for the same user
  private pendingCreations: Map<string, Promise<AgentWallet>> = new Map();

  async getOrCreateWallet(userPublicKey: string): Promise<AgentWallet> {
    // If there's already an in-flight creation for this key, wait for it
    const pending = this.pendingCreations.get(userPublicKey);
    if (pending) return pending;

    const promise = this._getOrCreateWalletImpl(userPublicKey);
    this.pendingCreations.set(userPublicKey, promise);

    try {
      return await promise;
    } finally {
      this.pendingCreations.delete(userPublicKey);
    }
  }

  private async _getOrCreateWalletImpl(userPublicKey: string): Promise<AgentWallet> {
    const existing = await walletStore.getWallet(userPublicKey);

    if (existing) {
      // Verify decryptability before returning an existing wallet.
      try {
        decrypt(existing.agent_secret_key_enc);
      } catch (err: any) {
        console.error(`[AgentWallet] Failed to decrypt wallet for ${userPublicKey.slice(0, 8)}...`);
        throw new Error(
          'Stored agent wallet cannot be decrypted. WALLET_ENCRYPTION_KEY is likely missing or changed. Restore the original key to recover this wallet.'
        );
      }
      return this.enrichWallet(existing);
    }

    return this._createNewWallet(userPublicKey);
  }

  private async _createNewWallet(userPublicKey: string): Promise<AgentWallet> {
    const keypair = StellarSdk.Keypair.random();
    const encryptedSecret = encrypt(keypair.secret());

    const row = await walletStore.createWallet(
      userPublicKey,
      keypair.publicKey(),
      encryptedSecret
    );

    events.log('info', 'AgentWallet', `Created agent wallet for ${userPublicKey.slice(0, 8)}...`, undefined, userPublicKey);

    return {
      userPublicKey: row.user_public_key,
      agentPublicKey: row.agent_public_key,
      activated: false,
      balance: 0,
      xlmBalance: 0,
      createdAt: row.created_at,
    };
  }

  async getWallet(userPublicKey: string): Promise<AgentWallet | null> {
    const row = await walletStore.getWallet(userPublicKey);
    if (!row) return null;
    return this.enrichWallet(row);
  }

  async getKeypair(userPublicKey: string): Promise<StellarSdk.Keypair> {
    const row = await walletStore.getWallet(userPublicKey);
    if (!row) throw new Error('Agent wallet not found');

    try {
      const secret = decrypt(row.agent_secret_key_enc);
      return StellarSdk.Keypair.fromSecret(secret);
    } catch (err: any) {
      // If decryption fails (e.g. key changed after server restart), recreate wallet
      console.warn(`[AgentWallet] Decryption failed for ${userPublicKey.slice(0, 8)}..., recreating wallet`);
      await walletStore.deleteWallet(userPublicKey);
      throw new Error('Agent wallet corrupted — please reconnect your wallet to create a new one');
    }
  }

  async buildActivationTx(userPublicKey: string, xlmAmount: number = 5): Promise<string> {
    const row = await walletStore.getWallet(userPublicKey);
    if (!row) throw new Error('Agent wallet not found');

    return stellarService.buildActivationTx(
      userPublicKey,
      row.agent_public_key,
      xlmAmount
    );
  }

  async submitActivation(userPublicKey: string, signedTxXdr: string): Promise<{ activated: boolean; agentPublicKey: string }> {
    const row = await walletStore.getWallet(userPublicKey);
    if (!row) throw new Error('Agent wallet not found');

    // Submit the createAccount TX
    await stellarService.submitSignedActivationTx(signedTxXdr);

    // Set up USDC trustline (server-signed)
    const keypair = await this.getKeypair(userPublicKey);
    await stellarService.setupUserAgentUsdc(keypair);

    // Mark activated in DB
    await walletStore.markActivated(userPublicKey);

    events.log('info', 'AgentWallet', `Activated agent wallet for ${userPublicKey.slice(0, 8)}...`, undefined, userPublicKey);

    return { activated: true, agentPublicKey: row.agent_public_key };
  }

  async buildFundTx(userPublicKey: string, amount: number): Promise<{ unsignedTxXdr: string; agentPublicKey: string }> {
    const row = await walletStore.getWallet(userPublicKey);
    if (!row) throw new Error('Agent wallet not found');

    const unsignedTxXdr = await stellarService.buildFundAgentTx(
      userPublicKey,
      amount,
      row.agent_public_key
    );

    return { unsignedTxXdr, agentPublicKey: row.agent_public_key };
  }

  async withdraw(userPublicKey: string, amount: number): Promise<{ txHash: string; newBalance: number }> {
    const row = await walletStore.getWallet(userPublicKey);
    if (!row) throw new Error('Agent wallet not found');

    // Check balance
    const balance = await stellarService.getBalance(row.agent_public_key);
    if (balance < amount) {
      throw new Error(`Insufficient balance: ${balance.toFixed(2)} USDC < ${amount.toFixed(2)} USDC`);
    }

    const keypair = await this.getKeypair(userPublicKey);
    const txHash = await stellarService.buildAndSubmitWithdrawTx(keypair, userPublicKey, amount);

    const newBalance = await stellarService.getBalance(row.agent_public_key);
    events.log('info', 'AgentWallet', `Withdrew ${amount} USDC to ${userPublicKey.slice(0, 8)}...`, undefined, userPublicKey);

    return { txHash, newBalance };
  }

  private async enrichWallet(row: { user_public_key: string; agent_public_key: string; activated: number; created_at: string }): Promise<AgentWallet> {
    const activation = await stellarService.checkAccountActivation(row.agent_public_key);
    const balance = activation.activated
      ? await stellarService.getBalance(row.agent_public_key)
      : 0;

    // Sync activation status with DB if it changed
    if (activation.activated && !row.activated) {
      await walletStore.markActivated(row.user_public_key);
    }

    return {
      userPublicKey: row.user_public_key,
      agentPublicKey: row.agent_public_key,
      activated: activation.activated,
      balance,
      xlmBalance: activation.xlmBalance,
      createdAt: row.created_at,
    };
  }
}

export const agentWalletService = new AgentWalletService();
