import { Router } from 'express';
import { gatewayService } from '../services/gateway.service';
import { stellarService } from '../services/stellar.service';
import { events } from '../services/events.service';
import { sensitiveLimiter } from '../middleware/rateLimiter';
import { safeErrorMessage } from '../middleware/errorHandler';

export const x402Router = Router();

// Prepare payment — returns unsigned TX XDR for Freighter to sign
x402Router.post('/prepare-payment', sensitiveLimiter, async (req, res) => {
  try {
    const { wrappedPath, sourcePublicKey } = req.body;
    if (!wrappedPath || !sourcePublicKey) {
      return res.status(400).json({ error: 'wrappedPath and sourcePublicKey are required' });
    }

    // Get 402 response with payment info
    const response = await gatewayService.handleWrappedRequest(wrappedPath, undefined, {});
    if (response.status !== 402) {
      return res.json({ step: 'already_accessible', response: response.body });
    }

    const paymentInfo = response.body;
    events.log('payment', 'Gateway', `Preparing payment for ${wrappedPath}: ${paymentInfo.amount} USDC`);

    // Build unsigned TX
    const unsignedTxXdr = await stellarService.buildUnsignedPaymentTx(
      sourcePublicKey,
      paymentInfo.address,
      paymentInfo.amount,
      paymentInfo.memo
    );

    res.json({
      paymentId: paymentInfo.paymentId,
      unsignedTxXdr,
      amount: paymentInfo.amount,
      destination: paymentInfo.address,
      memo: paymentInfo.memo,
    });
  } catch (err: any) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

// Submit signed payment — verifies and forwards
x402Router.post('/submit-payment', sensitiveLimiter, async (req, res) => {
  try {
    const { signedTxXdr, paymentId, wrappedPath } = req.body;
    if (!signedTxXdr || !paymentId || !wrappedPath) {
      return res.status(400).json({ error: 'signedTxXdr, paymentId, and wrappedPath are required' });
    }

    // Submit the signed transaction
    const txHash = await stellarService.submitSignedTransaction(signedTxXdr, paymentId);

    // Verify
    await stellarService.verifyPayment(paymentId);

    // Forward request
    const apiResponse = await gatewayService.handleWrappedRequest(wrappedPath, paymentId, req.query as any);

    res.json({
      paymentId,
      txHash,
      amount: (await import('../store/memory.store')).store.getPayment(paymentId)?.amount,
      apiResponse: apiResponse.body,
    });
  } catch (err: any) {
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

// Legacy pay-and-verify removed for security — use prepare-payment + submit-payment flow instead

// Wrapped API endpoint
x402Router.get('/*', async (req, res) => {
  const wrappedPath = req.path;
  const paymentId = req.headers['x-payment-id'] as string | undefined;
  const result = await gatewayService.handleWrappedRequest(wrappedPath, paymentId, req.query as any);
  res.status(result.status).json(result.body);
});
