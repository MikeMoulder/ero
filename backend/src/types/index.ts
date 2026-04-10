// === Gateway Types ===

export interface RegisteredAPI {
  id: string;
  name: string;
  baseUrl: string;
  slug: string;
  price: number;
  receiverAddress: string;
  owner: string;
  status: 'active' | 'inactive';
  callCount: number;
  totalRevenue: number;
  createdAt: string;
}

// === Payment Types ===

export interface PaymentRequest {
  id: string;
  apiId: string;
  apiName: string;
  amount: number;
  destinationAddress: string;
  memo: string;
  status: 'pending' | 'submitted' | 'verified' | 'consumed' | 'expired' | 'failed';
  txHash: string | null;
  callerType: 'manual' | 'agent';
  agentId: string | null;
  taskId: string | null;
  userPublicKey: string;
  createdAt: string;
  verifiedAt: string | null;
}

// === Agent Types ===

export interface Agent {
  id: string;
  name: string;
  role: 'data_retrieval' | 'summarization' | 'verification' | 'analysis';
  walletBalance: number;
  maxSpendPerTask: number;
  totalSpent: number;
  status: 'idle' | 'working' | 'done' | 'failed';
}

export interface TaskStep {
  id: string;
  index: number;
  description: string;
  agentId: string | null;
  agentName: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  requiresApi: boolean;
  apiEndpoint: string | null;
  queryParams: Record<string, string> | null;
  estimatedCost: number;
  paymentId: string | null;
  input: any;
  output: any;
  logs: LogEntry[];
  startedAt: string | null;
  completedAt: string | null;
}

export interface Task {
  id: string;
  prompt: string;
  userPublicKey: string;
  status: 'pending' | 'decomposing' | 'awaiting_approval' | 'executing' | 'completed' | 'failed';
  steps: TaskStep[];
  agents: Agent[];
  totalSpent: number;
  result: any;
  createdAt: string;
  completedAt: string | null;
}

// === Agent Wallet ===

export interface AgentWallet {
  userPublicKey: string;
  agentPublicKey: string;
  activated: boolean;
  balance: number;
  xlmBalance: number;
  createdAt: string;
}

// === Logging ===

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'payment' | 'agent';
  source: string;
  message: string;
  userPublicKey?: string;
  data?: any;
}

// === Dashboard ===

export interface ApiSummary {
  id: string;
  name: string;
  slug: string;
  price: number;
  callCount: number;
  totalRevenue: number;
  status: 'active' | 'inactive';
}

export interface PaymentSubset {
  count: number;
  totalAmount: number;
  successRate: number;
}

export interface GatewayMetrics {
  totalApis: number;
  activeApis: number;
  totalCalls: number;
  totalRevenue: number;
  avgPricePerCall: number;
  topApisByRevenue: ApiSummary[];
  topApisByCalls: ApiSummary[];
  manualPayments: PaymentSubset;
  manualPaymentsByStatus: Record<string, number>;
}

export interface PlaygroundMetrics {
  totalTasks: number;
  tasksByStatus: Record<string, number>;
  completionRate: number;
  avgStepsPerTask: number;
  avgCostPerTask: number;
  avgDurationMs: number;
  totalAgentSpend: number;
  agentPayments: PaymentSubset;
  roleDistribution: Record<string, number>;
  tasksWithApiCalls: number;
}

export interface OverviewMetrics {
  totalUsdcFlow: number;
  walletBalance: number;
  paymentSuccessRate: number;
  totalPayments: number;
  paymentsByStatus: Record<string, number>;
  paymentsByCallerType: { manual: number; agent: number };
}

export interface EnhancedDashboardStats {
  overview: OverviewMetrics;
  gateway: GatewayMetrics;
  playground: PlaygroundMetrics;
  recentLogs: LogEntry[];
  recentPayments: PaymentRequest[];
}

// === WebSocket Events ===

export type WSEvent =
  | { type: 'log'; payload: LogEntry }
  | { type: 'task_update'; payload: Task }
  | { type: 'step_update'; payload: { taskId: string; step: TaskStep; agents?: Agent[] } }
  | { type: 'payment_update'; payload: PaymentRequest }
  | { type: 'stats_update'; payload: Partial<EnhancedDashboardStats> }
  | { type: 'approval_required'; payload: { taskId: string; steps: TaskStep[]; totalEstimatedCost: number; agentBalance: number } };
