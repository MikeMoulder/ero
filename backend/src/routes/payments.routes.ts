import { Router } from 'express';
import { store } from '../store/memory.store';

export const paymentsRouter = Router();

paymentsRouter.get('/', async (req, res) => {
  const userPublicKey = req.query.userPublicKey as string | undefined;
  if (userPublicKey) {
    return res.json(await store.getPaymentsByUser(userPublicKey));
  }
  res.json(await store.getAllPayments());
});

paymentsRouter.get('/:id', async (req, res) => {
  const payment = await store.getPayment(req.params.id);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  res.json(payment);
});
