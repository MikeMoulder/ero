import { loadConfig } from './config-store';
import http from 'http';
import https from 'https';
import { URL } from 'url';

function getBaseUrl(): string {
  return loadConfig().apiUrl;
}

export async function request<T = any>(path: string, options?: { method?: string; body?: any }): Promise<T> {
  const url = new URL(path, getBaseUrl());
  const isHttps = url.protocol === 'https:';
  const lib = isHttps ? https : http;

  const bodyStr = options?.body ? JSON.stringify(options.body) : undefined;

  return new Promise((resolve, reject) => {
    const req = lib.request(url, {
      method: options?.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr).toString() } : {}),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(parsed.error || `Request failed: ${res.statusCode}`));
          } else {
            resolve(parsed as T);
          }
        } catch {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Request failed: ${res.statusCode}`));
          } else {
            resolve(data as any);
          }
        }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// === Gateway ===
export const registerApi = (data: { baseUrl: string; slug: string; price: number; receiverAddress?: string; owner?: string }) =>
  request('/api/register-api', { method: 'POST', body: data });

export const getApis = (owner?: string) =>
  request<any[]>(owner ? `/api/apis?owner=${encodeURIComponent(owner)}` : '/api/apis');

export const removeApi = (id: string) =>
  request(`/api/apis/${id}`, { method: 'DELETE' });

// === Agent Wallet ===
export const getAgentWallet = (userPublicKey: string) =>
  request<{ agentPublicKey: string; balance: number; activated: boolean; xlmBalance: number }>(
    `/api/agent-wallet?userPublicKey=${encodeURIComponent(userPublicKey)}`
  );

export const activateWallet = (userPublicKey: string, xlmAmount?: number) =>
  request<{ unsignedTxXdr: string }>('/api/wallet/activate', {
    method: 'POST',
    body: { userPublicKey, xlmAmount },
  });

export const submitActivation = (userPublicKey: string, signedTxXdr: string) =>
  request<{ activated: boolean; agentPublicKey: string }>('/api/wallet/activate/submit', {
    method: 'POST',
    body: { userPublicKey, signedTxXdr },
  });

export const fundAgent = (sourcePublicKey: string, amount: number, userPublicKey: string) =>
  request<{ unsignedTxXdr: string; agentPublicKey: string; amount: number }>('/api/fund-agent', {
    method: 'POST',
    body: { sourcePublicKey, amount, userPublicKey },
  });

export const submitFunding = (signedTxXdr: string, userPublicKey: string) =>
  request<{ txHash: string; newBalance: number }>('/api/fund-agent/submit', {
    method: 'POST',
    body: { signedTxXdr, userPublicKey },
  });

export const withdrawFromAgent = (userPublicKey: string, amount: number) =>
  request<{ txHash: string; newBalance: number }>('/api/wallet/withdraw', {
    method: 'POST',
    body: { userPublicKey, amount },
  });

// === Tasks ===
export const createTask = (prompt: string, userPublicKey: string) =>
  request<any>('/api/tasks', { method: 'POST', body: { prompt, userPublicKey } });

export const executeTask = (id: string) =>
  request(`/api/tasks/${id}/execute`, { method: 'POST' });

export const approveTask = (id: string, decision: 'approve' | 'deny' | 'approve_always') =>
  request(`/api/tasks/${id}/approve`, { method: 'POST', body: { decision } });

export const getTasks = (userPublicKey?: string) =>
  request<any[]>(userPublicKey ? `/api/tasks?userPublicKey=${encodeURIComponent(userPublicKey)}` : '/api/tasks');

export const getTask = (id: string) =>
  request<any>(`/api/tasks/${id}`);

// === Balance ===
export const getBalance = (publicKey: string) =>
  request<{ publicKey: string; balance: number }>(`/api/balance/${publicKey}`);

// === Faucet ===
export const requestFaucet = (publicKey: string, amount?: number) =>
  request<{ step: string; unsignedTrustlineTxXdr?: string; amount: number; message: string }>('/api/faucet', {
    method: 'POST',
    body: { publicKey, amount },
  });

export const submitFaucet = (signedTrustlineTxXdr: string, publicKey: string, amount?: number) =>
  request<{ step: string; txHash: string; amount: number; message: string }>('/api/faucet/submit', {
    method: 'POST',
    body: { signedTrustlineTxXdr, publicKey, amount },
  });

// === Dashboard ===
export const getStats = (userPublicKey?: string) =>
  request<any>(userPublicKey ? `/api/dashboard/stats?userPublicKey=${encodeURIComponent(userPublicKey)}` : '/api/dashboard/stats');

// === x402 ===
export const testWrappedApi = (slug: string) =>
  request<any>(`/x402/${slug}`);
