import rateLimit from 'express-rate-limit';

// General API rate limit
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// Strict limiter for sensitive endpoints (wallet creation, payments, tasks)
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded on sensitive endpoint' },
});

// Faucet limiter — very strict
export const faucetLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Faucet rate limit exceeded. Try again in a few minutes.' },
});
