import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { WebSocketServer } from 'ws';
import { config } from './config';
import { events } from './services/events.service';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { gatewayRouter } from './routes/gateway.routes';
import { x402Router } from './routes/x402.routes';
import { tasksRouter } from './routes/tasks.routes';
import { paymentsRouter } from './routes/payments.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { walletRouter } from './routes/wallet.routes';
import { store } from './store/memory.store';
import { walletStore } from './store/wallet.store';
import { stellarService } from './services/stellar.service';
import { seedApis } from './services/seed.service';

const app = express();

// Trust reverse proxy (Render, etc.)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({ origin: config.frontendUrl }));
app.use(express.json({ limit: '100kb' }));
app.use(generalLimiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', gatewayRouter);
app.use('/api/wallet', walletRouter);
app.use('/x402', x402Router);
app.use('/api/tasks', tasksRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/dashboard', dashboardRouter);

// Error handler
app.use(errorHandler);

// HTTP + WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Allowed WebSocket origins
const allowedOrigins = new Set([
  config.frontendUrl,
  `http://localhost:${config.port}`,
]);

wss.on('connection', (ws, req) => {
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.has(origin)) {
    ws.close(4003, 'Origin not allowed');
    return;
  }
  // Extract userPublicKey from query string (e.g. /ws?userPublicKey=G...)
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const userPublicKey = url.searchParams.get('userPublicKey') || undefined;
  events.addClient(ws, userPublicKey);
  events.log('info', 'WebSocket', 'Client connected', undefined, userPublicKey);
});

async function startServer(): Promise<void> {
  await walletStore.initialize();
  await store.initialize();
  await seedApis();

  server.listen(config.port, () => {
    console.log(`[X402 Gateway] Server running on http://localhost:${config.port}`);
    console.log(`[X402 Gateway] WebSocket on ws://localhost:${config.port}/ws`);
    events.log('info', 'System', 'X402 Agent Gateway started');

    // Start Soroban contract sync (every 30s)
    store.startAutoSync();
  });
}

startServer().catch((err) => {
  console.error('[X402 Gateway] Startup failed:', err.message);
  process.exit(1);
});

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\n[X402 Gateway] ${signal} received, shutting down...`);
  store.stopAutoSync();
  events.stopHeartbeat();
  wss.close(() => {
    server.close(() => {
      store.close();
      walletStore.close();
      console.log('[X402 Gateway] Shutdown complete');
      process.exit(0);
    });
  });
  // Force exit after 5s if graceful shutdown stalls
  setTimeout(() => {
    console.error('[X402 Gateway] Forced shutdown after timeout');
    store.close();
    walletStore.close();
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
