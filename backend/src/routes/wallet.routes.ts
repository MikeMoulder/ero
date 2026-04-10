import { Router } from 'express';
import { agentWalletService } from '../services/agent-wallet.service';
import { walletStore } from '../store/wallet.store';
import { sensitiveLimiter } from '../middleware/rateLimiter';
import { safeErrorMessage } from '../middleware/errorHandler';

export const walletRouter = Router();

const MAX_XLM_ACTIVATION = 20;

// Build unsigned activation TX (createAccount) for Freighter signing
walletRouter.post('/activate', sensitiveLimiter, async (req, res) => {
  try {
    const { userPublicKey, xlmAmount } = req.body;
    if (!userPublicKey) {
      return res.status(400).json({ error: 'userPublicKey is required' });
    }

    const clampedXlm = Math.min(Math.max(xlmAmount || 5, 1), MAX_XLM_ACTIVATION);

    const unsignedTxXdr = await agentWalletService.buildActivationTx(
      userPublicKey,
      clampedXlm
    );

    res.json({ unsignedTxXdr });
  } catch (err: any) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

// Submit signed activation TX, set up USDC trustline
walletRouter.post('/activate/submit', sensitiveLimiter, async (req, res) => {
  try {
    const { userPublicKey, signedTxXdr } = req.body;
    if (!userPublicKey || !signedTxXdr) {
      return res.status(400).json({ error: 'userPublicKey and signedTxXdr are required' });
    }

    const result = await agentWalletService.submitActivation(userPublicKey, signedTxXdr);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

// Withdraw USDC from agent wallet to user's Freighter wallet (server-signed)
// Ownership check: the agent wallet's user_public_key must match the request
walletRouter.post('/withdraw', sensitiveLimiter, async (req, res) => {
  try {
    const { userPublicKey, amount } = req.body;
    if (!userPublicKey || !amount) {
      return res.status(400).json({ error: 'userPublicKey and amount are required' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }
    if (amount > 100000) {
      return res.status(400).json({ error: 'amount exceeds maximum withdrawal limit' });
    }

    // Verify the wallet exists for this user (ownership boundary)
    const wallet = walletStore.getWallet(userPublicKey);
    if (!wallet) {
      return res.status(404).json({ error: 'Agent wallet not found' });
    }

    const result = await agentWalletService.withdraw(userPublicKey, amount);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});
