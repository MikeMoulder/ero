import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[Error]', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
  });
}

/**
 * Wraps an error message for client responses, stripping internal details.
 * Only passes through known-safe error prefixes.
 */
const SAFE_ERROR_PREFIXES = [
  'Invalid Stellar public key',
  'Invalid baseUrl',
  'baseUrl, slug, and price are required',
  'price must be a positive number',
  'callerPublicKey',
  'signedTxXdr',
  'userPublicKey',
  'wrappedPath',
  'prompt is required',
  'amount must be',
  'Insufficient balance',
  'Agent wallet not found',
  'Agent wallet corrupted',
  'Task not found',
  'Task is not',
  'API not found',
  'Slug "',
  'Invalid slug',
  'already registered',
  'decision must be',
  'Soroban contract not configured',
];

export function safeErrorMessage(err: any): string {
  const msg = err?.message || 'Something went wrong';
  for (const prefix of SAFE_ERROR_PREFIXES) {
    if (msg.startsWith(prefix) || msg.includes(prefix)) {
      return msg;
    }
  }
  return 'Something went wrong';
}
