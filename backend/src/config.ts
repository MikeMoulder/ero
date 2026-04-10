import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  stellar: {
    network: process.env.STELLAR_NETWORK || 'testnet',
    horizonUrl: process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
    agentSecretKey: process.env.AGENT_SECRET_KEY || process.env.STELLAR_SECRET_KEY || '',
    usdcIssuerSecret: process.env.USDC_ISSUER_SECRET || '',
  },

  soroban: {
    rpcUrl: process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org:443',
    contractId: process.env.SOROBAN_CONTRACT_ID || '',
  },

  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001',
    baseUrl: 'https://openrouter.ai/api/v1',
  },

  turso: {
    url: process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_AUTH_TOKEN || '',
  },

  agent: {
    defaultBalance: parseFloat(process.env.DEFAULT_AGENT_BALANCE || '100'),
    defaultMaxSpend: parseFloat(process.env.DEFAULT_MAX_SPEND_PER_TASK || '10'),
  },

  wallet: {
    encryptionKey: process.env.WALLET_ENCRYPTION_KEY || '',
    dbPath: process.env.WALLET_DB_PATH || '',
  },
};
