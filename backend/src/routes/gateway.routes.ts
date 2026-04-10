import { Router } from 'express';
import { gatewayService } from '../services/gateway.service';
import { stellarService } from '../services/stellar.service';
import { sorobanService } from '../services/soroban.service';
import { agentWalletService } from '../services/agent-wallet.service';
import { store } from '../store/memory.store';
import { sensitiveLimiter, faucetLimiter } from '../middleware/rateLimiter';
import { safeErrorMessage } from '../middleware/errorHandler';

export const gatewayRouter = Router();

const MAX_FAUCET_AMOUNT = 10000;

// === API Registration (in-memory + Soroban on-chain) ===

// Direct registration (in-memory, used when Soroban is not configured)
gatewayRouter.post('/register-api', sensitiveLimiter, (req, res) => {
  try {
    const { baseUrl, slug, price, receiverAddress, owner } = req.body;
    if (!baseUrl || !slug || !price) {
      return res.status(400).json({ error: 'baseUrl, slug, and price are required' });
    }
    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ error: 'price must be a positive number' });
    }
    const api = gatewayService.registerApi(baseUrl, slug, price, receiverAddress, owner);
    res.status(201).json(api);
  } catch (err: any) {
    res.status(400).json({ error: safeErrorMessage(err) });
  }
});

// Soroban: prepare unsigned register TX for Freighter signing
gatewayRouter.post('/register-api/prepare', sensitiveLimiter, async (req, res) => {
  try {
    const { callerPublicKey, baseUrl, slug, price, receiverAddress } = req.body;
    if (!callerPublicKey || !baseUrl || !slug || !price) {
      return res.status(400).json({ error: 'callerPublicKey, baseUrl, slug, and price are required' });
    }

    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9\-]/g, '').replace(/^-+|-+$/g, '');
    const receiver = receiverAddress || stellarService.getAgentPublicKey();

    const unsignedTxXdr = await sorobanService.buildRegisterApiTx(
      callerPublicKey, baseUrl, normalizedSlug, price, receiver
    );

    res.json({ unsignedTxXdr });
  } catch (err: any) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

// Soroban: submit signed register TX
gatewayRouter.post('/register-api/submit', sensitiveLimiter, async (req, res) => {
  try {
    const { signedTxXdr, baseUrl, slug, price, receiverAddress, owner } = req.body;
    if (!signedTxXdr) {
      return res.status(400).json({ error: 'signedTxXdr is required' });
    }

    const txHash = await sorobanService.submitTransaction(signedTxXdr);

    // Also register locally and sync from contract
    const api = gatewayService.registerApi(
      baseUrl, slug, price, receiverAddress, owner
    );

    // Trigger a contract sync to pick up the on-chain ID
    await store.syncFromContract();

    res.status(201).json({ ...api, txHash });
  } catch (err: any) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

// Soroban: prepare unsigned remove TX
gatewayRouter.post('/apis/:id/remove/prepare', async (req, res) => {
  try {
    const { callerPublicKey } = req.body;
    if (!callerPublicKey) {
      return res.status(400).json({ error: 'callerPublicKey is required' });
    }

    const api = store.getApi(req.params.id);
    if (!api) {
      return res.status(404).json({ error: 'API not found' });
    }

    // Ownership check
    if (api.owner && api.owner !== callerPublicKey) {
      return res.status(403).json({ error: 'You do not own this API' });
    }

    const unsignedTxXdr = await sorobanService.buildRemoveApiTx(callerPublicKey, api.id);
    res.json({ unsignedTxXdr });
  } catch (err: any) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

// Soroban: submit signed remove TX
gatewayRouter.post('/apis/:id/remove/submit', async (req, res) => {
  try {
    const { signedTxXdr } = req.body;
    if (!signedTxXdr) {
      return res.status(400).json({ error: 'signedTxXdr is required' });
    }

    await sorobanService.submitTransaction(signedTxXdr);

    // Remove locally
    store.removeApi(req.params.id);
    await store.syncFromContract();

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

gatewayRouter.get('/apis', (req, res) => {
  const owner = req.query.owner as string | undefined;
  let apis = store.getAllApis();
  if (owner) {
    apis = apis.filter(a => a.owner === owner);
  }
  res.json(apis);
});

gatewayRouter.delete('/apis/:id', (req, res) => {
  const api = store.getApi(req.params.id);
  if (!api) {
    return res.status(404).json({ error: 'API not found' });
  }

  // Ownership check: require owner query param to match
  const callerPublicKey = req.query.callerPublicKey as string;
  if (api.owner && api.owner !== callerPublicKey) {
    return res.status(403).json({ error: 'You do not own this API' });
  }

  store.removeApi(req.params.id);
  res.json({ success: true });
});

// === Agent Wallet ===

gatewayRouter.get('/agent-wallet', sensitiveLimiter, async (req, res) => {
  try {
    const userPublicKey = req.query.userPublicKey as string;
    if (userPublicKey) {
      const wallet = await agentWalletService.getOrCreateWallet(userPublicKey);
      return res.json(wallet);
    }
    // Fallback: return shared server wallet for backward compat
    const publicKey = stellarService.getAgentPublicKey();
    const balance = await stellarService.getAgentBalance();
    res.json({ publicKey, balance });
  } catch (err: any) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

gatewayRouter.post('/fund-agent', sensitiveLimiter, async (req, res) => {
  try {
    const { sourcePublicKey, amount, userPublicKey } = req.body;
    if (!sourcePublicKey || !amount) {
      return res.status(400).json({ error: 'sourcePublicKey and amount are required' });
    }

    // If userPublicKey provided, fund their personal agent wallet
    if (userPublicKey) {
      const result = await agentWalletService.buildFundTx(userPublicKey, amount);
      return res.json({ ...result, amount });
    }

    // Fallback: fund shared server wallet
    const unsignedTxXdr = await stellarService.buildFundAgentTx(sourcePublicKey, amount);
    res.json({
      unsignedTxXdr,
      agentPublicKey: stellarService.getAgentPublicKey(),
      amount,
    });
  } catch (err: any) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

gatewayRouter.post('/fund-agent/submit', sensitiveLimiter, async (req, res) => {
  try {
    const { signedTxXdr, userPublicKey } = req.body;
    if (!signedTxXdr) {
      return res.status(400).json({ error: 'signedTxXdr is required' });
    }

    // Submit the funding transaction
    const tx = (await import('@stellar/stellar-sdk')).TransactionBuilder.fromXDR(
      signedTxXdr,
      (await import('@stellar/stellar-sdk')).Networks.TESTNET
    );
    const server = new (await import('@stellar/stellar-sdk')).Horizon.Server(
      (await import('../config')).config.stellar.horizonUrl
    );
    const result = await server.submitTransaction(tx);

    // Return the new balance for the correct wallet
    if (userPublicKey) {
      const wallet = await agentWalletService.getWallet(userPublicKey);
      return res.json({ txHash: result.hash, newBalance: wallet?.balance || 0 });
    }

    const newBalance = await stellarService.getAgentBalance();
    res.json({ txHash: result.hash, newBalance });
  } catch (err: any) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

// === Wallet Balance (for any public key) ===

gatewayRouter.get('/balance/:publicKey', async (req, res) => {
  try {
    const balance = await stellarService.getBalance(req.params.publicKey);
    res.json({ publicKey: req.params.publicKey, balance });
  } catch (err: any) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

// === USDC Faucet ===

gatewayRouter.get('/faucet/info', (_req, res) => {
  res.json({
    issuer: stellarService.getUsdcIssuer(),
    ready: stellarService.isIssuerReady(),
    asset: 'USDC',
    network: 'testnet',
  });
});

gatewayRouter.post('/faucet', faucetLimiter, async (req, res) => {
  try {
    const { publicKey, amount } = req.body;
    if (!publicKey) {
      return res.status(400).json({ error: 'publicKey is required' });
    }

    const faucetAmount = Math.min(amount || 1000, MAX_FAUCET_AMOUNT);
    const result = await stellarService.buildFaucetTx(publicKey, faucetAmount);

    if (result.needsTrustline) {
      res.json({
        step: 'sign_trustline',
        unsignedTrustlineTxXdr: result.unsignedTrustlineTxXdr,
        amount: result.amount,
        message: 'Sign the trustline transaction, then submit it back to receive USDC',
      });
    } else {
      res.json({
        step: 'done',
        amount: result.amount,
        message: `${result.amount} USDC sent to your wallet`,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

gatewayRouter.post('/faucet/submit', faucetLimiter, async (req, res) => {
  try {
    const { signedTrustlineTxXdr, publicKey, amount } = req.body;
    if (!signedTrustlineTxXdr || !publicKey) {
      return res.status(400).json({ error: 'signedTrustlineTxXdr and publicKey are required' });
    }

    // Server-side amount enforcement — ignore client-supplied amount
    const safeAmount = Math.min(Math.abs(amount || 1000), MAX_FAUCET_AMOUNT);

    const txHash = await stellarService.submitFaucet(signedTrustlineTxXdr, publicKey, safeAmount);
    res.json({
      step: 'done',
      txHash,
      amount: safeAmount,
      message: `${safeAmount} USDC sent to your wallet`,
    });
  } catch (err: any) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});
