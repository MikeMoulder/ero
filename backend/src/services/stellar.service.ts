import * as StellarSdk from '@stellar/stellar-sdk';
import { v4 as uuid } from 'uuid';
import axios from 'axios';
import { PaymentRequest } from '../types';
import { store } from '../store/memory.store';
import { events } from './events.service';
import { config } from '../config';

class StellarService {
  private server: StellarSdk.Horizon.Server;

  /** Emit a payment_update event scoped to the payment's owner */
  private emitPaymentUpdate(paymentId: string): void {
    const payment = store.getPayment(paymentId);
    if (!payment) return;
    const evt = { type: 'payment_update' as const, payload: payment };
    if (payment.userPublicKey) {
      events.sendToUser(payment.userPublicKey, evt);
    } else {
      events.broadcast(evt);
    }
  }
  private agentKeypair: StellarSdk.Keypair;
  private networkPassphrase: string;

  // Self-hosted testnet USDC issuer
  private issuerKeypair: StellarSdk.Keypair;
  private usdcAsset!: StellarSdk.Asset;
  private issuerReady = false;

  constructor() {
    this.server = new StellarSdk.Horizon.Server(config.stellar.horizonUrl);
    this.networkPassphrase = StellarSdk.Networks.TESTNET;

    // USDC issuer: use provided secret or auto-generate
    if (config.stellar.usdcIssuerSecret) {
      this.issuerKeypair = StellarSdk.Keypair.fromSecret(config.stellar.usdcIssuerSecret);
    } else {
      this.issuerKeypair = StellarSdk.Keypair.random();
    }
    this.usdcAsset = new StellarSdk.Asset('USDC', this.issuerKeypair.publicKey());

    // Agent keypair: use provided key or auto-generate
    if (config.stellar.agentSecretKey) {
      try {
        this.agentKeypair = StellarSdk.Keypair.fromSecret(config.stellar.agentSecretKey);
      } catch {
        console.warn('[Stellar] Invalid AGENT_SECRET_KEY, generating new keypair');
        this.agentKeypair = StellarSdk.Keypair.random();
      }
    } else {
      this.agentKeypair = StellarSdk.Keypair.random();
      console.log('[Stellar] Auto-generated agent keypair (no AGENT_SECRET_KEY in .env)');
    }

    console.log(`[Stellar] Agent wallet: ${this.agentKeypair.publicKey()}`);
    console.log(`[Stellar] USDC Issuer: ${this.issuerKeypair.publicKey()}`);

    // Bootstrap everything
    this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    // 1. Fund issuer via Friendbot
    await this.ensureAccountFunded(this.issuerKeypair.publicKey());
    // 2. Fund agent via Friendbot
    await this.ensureAccountFunded(this.agentKeypair.publicKey());
    // 3. Set up agent USDC trustline + mint initial USDC
    await this.setupAgentUsdc();

    this.issuerReady = true;
    console.log('[Stellar] USDC issuer ready — faucet available');
    if (!config.stellar.usdcIssuerSecret) {
      console.log('[Stellar] Tip: Set USDC_ISSUER_SECRET in .env to persist the issuer across restarts');
    }
    events.log('info', 'Stellar', `USDC issuer ready: ${this.issuerKeypair.publicKey()}`);
  }

  private async ensureAccountFunded(publicKey: string): Promise<void> {
    try {
      await this.server.loadAccount(publicKey);
    } catch {
      try {
        await axios.get(`https://friendbot.stellar.org?addr=${publicKey}`);
        console.log(`[Stellar] Funded ${publicKey.slice(0, 8)}... via Friendbot`);
      } catch (err: any) {
        console.warn(`[Stellar] Friendbot funding failed for ${publicKey.slice(0, 8)}...:`, err.message);
      }
    }
  }

  private async setupAgentUsdc(): Promise<void> {
    try {
      const account = await this.server.loadAccount(this.agentKeypair.publicKey());
      const hasTrustline = account.balances.some(
        (b: any) => b.asset_code === 'USDC' && b.asset_issuer === this.issuerKeypair.publicKey()
      );

      if (!hasTrustline) {
        // Add trustline
        const trustTx = new StellarSdk.TransactionBuilder(account, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: this.networkPassphrase,
        })
          .addOperation(StellarSdk.Operation.changeTrust({ asset: this.usdcAsset }))
          .setTimeout(30)
          .build();

        trustTx.sign(this.agentKeypair);
        await this.server.submitTransaction(trustTx);
        console.log('[Stellar] USDC trustline established for agent wallet');
      }

      // Mint 10,000 USDC to agent
      const agentBalance = await this.getBalance(this.agentKeypair.publicKey());
      if (agentBalance < 100) {
        await this.mintUsdc(this.agentKeypair.publicKey(), 10000);
        console.log('[Stellar] Minted 10,000 USDC to agent wallet');
      }
    } catch (err: any) {
      console.warn('[Stellar] Agent USDC setup failed:', err.message);
    }
  }

  // === USDC Faucet ===

  getUsdcIssuer(): string {
    return this.issuerKeypair.publicKey();
  }

  isIssuerReady(): boolean {
    return this.issuerReady;
  }

  /**
   * Mint test USDC from the issuer to any account.
   * If the account doesn't have a trustline, this will fail.
   */
  private async mintUsdc(destination: string, amount: number): Promise<string> {
    const issuerAccount = await this.server.loadAccount(this.issuerKeypair.publicKey());

    const tx = new StellarSdk.TransactionBuilder(issuerAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination,
          asset: this.usdcAsset,
          amount: amount.toFixed(7),
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(this.issuerKeypair);
    const result = await this.server.submitTransaction(tx);
    return result.hash;
  }

  /**
   * Build an unsigned trustline + faucet TX for a user to sign via Freighter.
   * Adds USDC trustline (if missing) then the issuer sends USDC in a separate server-signed tx.
   */
  async buildFaucetTx(publicKey: string, amount: number = 1000): Promise<{
    needsTrustline: boolean;
    unsignedTrustlineTxXdr?: string;
    amount: number;
  }> {
    const account = await this.server.loadAccount(publicKey);
    const hasTrustline = account.balances.some(
      (b: any) => b.asset_code === 'USDC' && b.asset_issuer === this.issuerKeypair.publicKey()
    );

    if (hasTrustline) {
      // Already has trustline — mint directly
      await this.mintUsdc(publicKey, amount);
      return { needsTrustline: false, amount };
    }

    // Build unsigned trustline TX for user to sign
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(StellarSdk.Operation.changeTrust({ asset: this.usdcAsset }))
      .setTimeout(60)
      .build();

    return {
      needsTrustline: true,
      unsignedTrustlineTxXdr: tx.toXDR(),
      amount,
    };
  }

  /**
   * After the user signs the trustline TX, submit it and then mint USDC.
   */
  async submitFaucet(signedTrustlineTxXdr: string, publicKey: string, amount: number = 1000): Promise<string> {
    // Submit trustline tx
    const tx = StellarSdk.TransactionBuilder.fromXDR(signedTrustlineTxXdr, this.networkPassphrase);
    await this.server.submitTransaction(tx);

    // Now mint
    const txHash = await this.mintUsdc(publicKey, amount);
    events.log('info', 'Faucet', `Minted ${amount} USDC to ${publicKey.slice(0, 8)}...`, undefined, publicKey);
    return txHash;
  }

  // === Payment Request Creation ===

  createPaymentRequest(apiId: string, apiName: string, amount: number, destinationAddress: string, userPublicKey: string = ''): PaymentRequest {
    const id = uuid();
    const payment: PaymentRequest = {
      id,
      apiId,
      apiName,
      amount,
      destinationAddress,
      memo: id,
      status: 'pending',
      txHash: null,
      callerType: 'manual',
      agentId: null,
      taskId: null,
      userPublicKey,
      createdAt: new Date().toISOString(),
      verifiedAt: null,
    };
    store.addPayment(payment);
    this.emitPaymentUpdate(payment.id);
    return payment;
  }

  // === User Payments (Freighter-signed) ===

  async buildUnsignedPaymentTx(
    sourcePublicKey: string,
    destinationAddress: string,
    amount: number,
    memo: string
  ): Promise<string> {
    const issuerPubKey = this.issuerKeypair.publicKey();

    // Check destination has USDC trustline
    try {
      const destAccount = await this.server.loadAccount(destinationAddress);
      const destHasTrust = destAccount.balances.some(
        (b: any) => b.asset_code === 'USDC' && b.asset_issuer === issuerPubKey
      );
      if (!destHasTrust) {
        throw new Error('Destination account does not have a USDC trustline. The API receiver must add a USDC trustline first.');
      }
    } catch (err: any) {
      if (err.message.includes('trustline')) throw err;
      throw new Error(`Cannot verify destination account: ${err.message}`);
    }

    const account = await this.server.loadAccount(sourcePublicKey);

    // Check if source needs a USDC trustline
    const sourceHasTrust = account.balances.some(
      (b: any) => b.asset_code === 'USDC' && b.asset_issuer === issuerPubKey
    );

    const builder = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    });

    // Add trustline first if source doesn't have one
    if (!sourceHasTrust) {
      builder.addOperation(StellarSdk.Operation.changeTrust({ asset: this.usdcAsset }));
    }

    builder
      .addOperation(
        StellarSdk.Operation.payment({
          destination: destinationAddress,
          asset: this.usdcAsset,
          amount: amount.toFixed(7),
        })
      )
      .addMemo(StellarSdk.Memo.text(memo.slice(0, 28)))
      .setTimeout(60);

    const tx = builder.build();
    return tx.toXDR();
  }

  async submitSignedTransaction(signedTxXdr: string, paymentId: string): Promise<string> {
    store.updatePayment(paymentId, { status: 'submitted' });
    this.emitPaymentUpdate(paymentId);
    const userPublicKey = store.getPayment(paymentId)?.userPublicKey;

    try {
      const tx = StellarSdk.TransactionBuilder.fromXDR(
        signedTxXdr,
        this.networkPassphrase
      );
      const result = await this.server.submitTransaction(tx);
      const txHash = result.hash;

      store.updatePayment(paymentId, { txHash });
      events.log('payment', 'Stellar', `Transaction submitted: ${txHash}`, undefined, userPublicKey);
      this.emitPaymentUpdate(paymentId);

      return txHash;
    } catch (err: any) {
      store.updatePayment(paymentId, { status: 'failed' });
      this.emitPaymentUpdate(paymentId);
      const detail = err?.response?.data?.extras?.result_codes || err.message;
      console.error('[Stellar] Submission failed:', JSON.stringify(detail));
      throw new Error('Stellar submission failed');
    }
  }

  // === Agent Payments (Server-signed, Autonomous) ===

  async sendPaymentFromKeypair(
    keypair: StellarSdk.Keypair,
    destinationAddress: string,
    amount: number,
    memo: string,
    paymentId: string,
    agentId?: string,
    taskId?: string
  ): Promise<string> {
    store.updatePayment(paymentId, {
      status: 'submitted',
      callerType: 'agent',
      agentId: agentId || null,
      taskId: taskId || null,
    });
    this.emitPaymentUpdate(paymentId);
    const userPublicKey = store.getPayment(paymentId)?.userPublicKey;

    try {
      const account = await this.server.loadAccount(keypair.publicKey());

      const tx = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: destinationAddress,
            asset: this.usdcAsset,
            amount: amount.toFixed(7),
          })
        )
        .addMemo(StellarSdk.Memo.text(memo.slice(0, 28)))
        .setTimeout(30)
        .build();

      tx.sign(keypair);
      const result = await this.server.submitTransaction(tx);
      const txHash = result.hash;

      store.updatePayment(paymentId, { txHash });
      events.log('payment', 'Stellar', `Agent transaction submitted: ${txHash}`, { amount, memo }, userPublicKey);
      this.emitPaymentUpdate(paymentId);

      return txHash;
    } catch (err: any) {
      store.updatePayment(paymentId, { status: 'failed' });
      this.emitPaymentUpdate(paymentId);
      const detail = err?.response?.data?.extras?.result_codes || err.message;
      console.error('[Stellar] Agent payment failed:', JSON.stringify(detail));
      throw new Error('Agent payment failed');
    }
  }

  async sendAgentPayment(
    destinationAddress: string,
    amount: number,
    memo: string,
    paymentId: string,
    agentId?: string,
    taskId?: string
  ): Promise<string> {
    return this.sendPaymentFromKeypair(
      this.agentKeypair, destinationAddress, amount, memo, paymentId, agentId, taskId
    );
  }

  // === Verification ===

  async verifyPayment(paymentId: string): Promise<boolean> {
    const payment = store.getPayment(paymentId);
    if (!payment) return false;
    if (payment.status === 'verified') return true;
    if (!payment.txHash) return false;

    try {
      const tx = await this.server.transactions().transaction(payment.txHash).call();

      // Exact memo match (memos are truncated to 28 chars when building TX)
      const expectedMemo = payment.memo.slice(0, 28);
      if (!tx.memo || tx.memo !== expectedMemo) {
        events.log('error', 'Stellar', `Memo mismatch for ${paymentId}: expected=${expectedMemo}, got=${tx.memo}`, undefined, payment.userPublicKey);
        return false;
      }

      // Verify payment operations contain a matching payment
      const ops = await this.server.operations().forTransaction(payment.txHash).call();
      const paymentOp = ops.records.find((op: any) =>
        op.type === 'payment' &&
        op.asset_code === 'USDC' &&
        op.asset_issuer === this.issuerKeypair.publicKey() &&
        op.to === payment.destinationAddress &&
        parseFloat(op.amount) >= payment.amount - 0.0000001 // float tolerance
      );

      if (!paymentOp) {
        events.log('error', 'Stellar', `No matching payment operation for ${paymentId}: expected ${payment.amount} USDC to ${payment.destinationAddress.slice(0, 8)}...`, undefined, payment.userPublicKey);
        return false;
      }

      store.updatePayment(paymentId, {
        status: 'verified',
        verifiedAt: new Date().toISOString(),
      });
      events.log('payment', 'Stellar', `Payment verified: ${paymentId}`, {
        txHash: payment.txHash,
        amount: payment.amount,
      }, payment.userPublicKey);
      this.emitPaymentUpdate(paymentId);
      return true;
    } catch (err: any) {
      events.log('error', 'Stellar', `Verification failed for ${paymentId}: ${err.message}`, undefined, payment.userPublicKey);
      return false;
    }
  }

  // === Balance & Info ===

  getAgentPublicKey(): string {
    return this.agentKeypair.publicKey();
  }

  async getAgentBalance(): Promise<number> {
    return this.getBalance(this.agentKeypair.publicKey());
  }

  async getBalance(publicKey: string): Promise<number> {
    if (!publicKey) return 0;
    try {
      const account = await this.server.loadAccount(publicKey);
      const usdc = account.balances.find(
        (b: any) => b.asset_code === 'USDC' && b.asset_issuer === this.issuerKeypair.publicKey()
      );
      return usdc ? parseFloat(usdc.balance) : 0;
    } catch {
      return 0;
    }
  }

  // === Funding (build unsigned TX for user to sign via Freighter) ===

  async buildFundAgentTx(sourcePublicKey: string, amount: number, agentPublicKey?: string): Promise<string> {
    const target = agentPublicKey || this.agentKeypair.publicKey();
    return this.buildUnsignedPaymentTx(
      sourcePublicKey,
      target,
      amount,
      'fund-agent'
    );
  }

  // === Account Activation ===

  async submitSignedActivationTx(signedTxXdr: string): Promise<string> {
    const tx = StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, this.networkPassphrase);
    const result = await this.server.submitTransaction(tx);
    return result.hash;
  }

  async checkAccountActivation(publicKey: string): Promise<{ activated: boolean; xlmBalance: number }> {
    try {
      const account = await this.server.loadAccount(publicKey);
      const nativeBalance = account.balances.find((b: any) => b.asset_type === 'native');
      return {
        activated: true,
        xlmBalance: nativeBalance ? parseFloat(nativeBalance.balance) : 0,
      };
    } catch {
      return { activated: false, xlmBalance: 0 };
    }
  }

  async buildActivationTx(sourcePublicKey: string, destinationPublicKey: string, xlmAmount: number = 5): Promise<string> {
    const sourceAccount = await this.server.loadAccount(sourcePublicKey);

    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.createAccount({
          destination: destinationPublicKey,
          startingBalance: xlmAmount.toFixed(7),
        })
      )
      .setTimeout(60)
      .build();

    return tx.toXDR();
  }

  async setupUserAgentUsdc(agentKeypair: StellarSdk.Keypair): Promise<void> {
    try {
      const account = await this.server.loadAccount(agentKeypair.publicKey());
      const hasTrustline = account.balances.some(
        (b: any) => b.asset_code === 'USDC' && b.asset_issuer === this.issuerKeypair.publicKey()
      );

      if (!hasTrustline) {
        const trustTx = new StellarSdk.TransactionBuilder(account, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: this.networkPassphrase,
        })
          .addOperation(StellarSdk.Operation.changeTrust({ asset: this.usdcAsset }))
          .setTimeout(30)
          .build();

        trustTx.sign(agentKeypair);
        await this.server.submitTransaction(trustTx);
        console.log(`[Stellar] USDC trustline established for ${agentKeypair.publicKey().slice(0, 8)}...`);
      }
    } catch (err: any) {
      console.warn('[Stellar] User agent USDC setup failed:', err.message);
      throw err;
    }
  }

  // === Withdraw (server-signed, agent wallet -> user wallet) ===

  async buildAndSubmitWithdrawTx(
    agentKeypair: StellarSdk.Keypair,
    destinationPublicKey: string,
    amount: number
  ): Promise<string> {
    const account = await this.server.loadAccount(agentKeypair.publicKey());

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: destinationPublicKey,
          asset: this.usdcAsset,
          amount: amount.toFixed(7),
        })
      )
      .addMemo(StellarSdk.Memo.text('withdraw-agent'))
      .setTimeout(30)
      .build();

    tx.sign(agentKeypair);
    const result = await this.server.submitTransaction(tx);
    return result.hash;
  }
}

export const stellarService = new StellarService();
