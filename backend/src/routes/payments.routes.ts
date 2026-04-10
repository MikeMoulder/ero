import { Router } from 'express';
import { store } from '../store/memory.store';

export const paymentsRouter = Router();

paymentsRouter.get('/', (_req, res) => {
  res.json(store.getAllPayments());
});

paymentsRouter.get('/:id', (req, res) => {
  const payment = store.getPayment(req.params.id);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  res.json(payment);
});
