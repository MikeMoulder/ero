const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // === Gateway ===
  registerApi: (data: {
    baseUrl: string;
    slug: string;
    price: number;
    receiverAddress?: string;
    owner?: string;
  }) => request('/api/register-api', { method: 'POST', body: JSON.stringify(data) }),

  getApis: (owner?: string) =>
    request<any[]>(owner ? `/api/apis?owner=${encodeURIComponent(owner)}` : '/api/apis'),

  removeApi: (id: string) =>
    request(`/api/apis/${id}`, { method: 'DELETE' }),

  // === Soroban: On-chain API Registration ===
  prepareRegisterApi: (data: {
    callerPublicKey: string;
    baseUrl: string;
    slug: string;
    price: number;
    receiverAddress?: string;
  }) => request<{ unsignedTxXdr: string }>('/api/register-api/prepare', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  submitRegisterApi: (data: {
    signedTxXdr: string;
    baseUrl: string;
    slug: string;
    price: number;
    receiverAddress?: string;
    owner?: string;
  }) => request('/api/register-api/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  prepareRemoveApi: (id: string, callerPublicKey: string) =>
    request<{ unsignedTxXdr: string }>(`/api/apis/${id}/remove/prepare`, {
      method: 'POST',
      body: JSON.stringify({ callerPublicKey }),
    }),

  submitRemoveApi: (id: string, signedTxXdr: string) =>
    request(`/api/apis/${id}/remove/submit`, {
      method: 'POST',
      body: JSON.stringify({ signedTxXdr }),
    }),

  // === Freighter Payment Flow ===
  preparePayment: (wrappedPath: string, sourcePublicKey: string) =>
    request<{
      paymentId: string;
      unsignedTxXdr: string;
      amount: number;
      destination: string;
      memo: string;
    }>('/x402/prepare-payment', {
      method: 'POST',
      body: JSON.stringify({ wrappedPath, sourcePublicKey }),
    }),

  submitPayment: (signedTxXdr: string, paymentId: string, wrappedPath: string) =>
    request<{
      paymentId: string;
      txHash: string;
      apiResponse: any;
    }>('/x402/submit-payment', {
      method: 'POST',
      body: JSON.stringify({ signedTxXdr, paymentId, wrappedPath }),
    }),

  // Legacy: server-side payment (backward compat)
  testPayment: (wrappedPath: string) =>
    request('/x402/pay-and-verify', {
      method: 'POST',
      body: JSON.stringify({ wrappedPath }),
    }),

  // === Agent Wallet ===
  getAgentWallet: (userPublicKey?: string) =>
    request<{ agentPublicKey: string; balance: number; activated: boolean; xlmBalance: number; createdAt: string; userPublicKey?: string }>(
      userPublicKey ? `/api/agent-wallet?userPublicKey=${encodeURIComponent(userPublicKey)}` : '/api/agent-wallet'
    ),

  fundAgent: (sourcePublicKey: string, amount: number, userPublicKey?: string) =>
    request<{ unsignedTxXdr: string; agentPublicKey: string; amount: number }>('/api/fund-agent', {
      method: 'POST',
      body: JSON.stringify({ sourcePublicKey, amount, userPublicKey }),
    }),

  submitAgentFunding: (signedTxXdr: string, userPublicKey?: string) =>
    request<{ txHash: string; newBalance: number }>('/api/fund-agent/submit', {
      method: 'POST',
      body: JSON.stringify({ signedTxXdr, userPublicKey }),
    }),

  // === Agent Wallet Activation ===
  activateAgentWallet: (userPublicKey: string, xlmAmount?: number) =>
    request<{ unsignedTxXdr: string }>('/api/wallet/activate', {
      method: 'POST',
      body: JSON.stringify({ userPublicKey, xlmAmount }),
    }),

  submitActivation: (userPublicKey: string, signedTxXdr: string) =>
    request<{ activated: boolean; agentPublicKey: string }>('/api/wallet/activate/submit', {
      method: 'POST',
      body: JSON.stringify({ userPublicKey, signedTxXdr }),
    }),

  // === Agent Wallet Withdraw ===
  withdrawFromAgent: (userPublicKey: string, amount: number) =>
    request<{ txHash: string; newBalance: number }>('/api/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ userPublicKey, amount }),
    }),

  // === Balance ===
  getBalance: (publicKey: string) =>
    request<{ publicKey: string; balance: number }>(`/api/balance/${publicKey}`),

  // === USDC Faucet ===
  requestFaucet: (publicKey: string, amount?: number) =>
    request<{ step: string; unsignedTrustlineTxXdr?: string; amount: number; message: string }>('/api/faucet', {
      method: 'POST',
      body: JSON.stringify({ publicKey, amount }),
    }),

  submitFaucet: (signedTrustlineTxXdr: string, publicKey: string, amount?: number) =>
    request<{ step: string; txHash: string; amount: number; message: string }>('/api/faucet/submit', {
      method: 'POST',
      body: JSON.stringify({ signedTrustlineTxXdr, publicKey, amount }),
    }),

  // === Tasks ===
  createTask: (prompt: string, userPublicKey: string) =>
    request('/api/tasks', { method: 'POST', body: JSON.stringify({ prompt, userPublicKey }) }),

  executeTask: (id: string) =>
    request(`/api/tasks/${id}/execute`, { method: 'POST' }),

  approveTask: (id: string, decision: 'approve' | 'deny' | 'approve_always') =>
    request(`/api/tasks/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    }),

  getTasks: () => request<any[]>('/api/tasks'),

  getTask: (id: string) => request(`/api/tasks/${id}`),

  // === Payments ===
  getPayments: () => request<any[]>('/api/payments'),

  // === Dashboard ===
  getStats: () => request<import('../types').EnhancedDashboardStats>('/api/dashboard/stats'),
};
