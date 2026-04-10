import { Router } from 'express';
import { store } from '../store/memory.store';
import {
  EnhancedDashboardStats,
  GatewayMetrics,
  PlaygroundMetrics,
  OverviewMetrics,
  ApiSummary,
  PaymentSubset,
} from '../types';

export const dashboardRouter = Router();

function computePaymentSubset(payments: { status: string; amount: number }[]): PaymentSubset {
  const settled = payments.filter(p => p.status !== 'pending');
  const successful = payments.filter(p => p.status === 'verified' || p.status === 'consumed');
  return {
    count: payments.length,
    totalAmount: successful.reduce((s, p) => s + p.amount, 0),
    successRate: settled.length > 0 ? successful.length / settled.length : 0,
  };
}

dashboardRouter.get('/stats', async (req, res) => {
  const userPublicKey = req.query.userPublicKey as string | undefined;
  const apis = userPublicKey ? await store.getApisByOwner(userPublicKey) : await store.getAllApis();
  const payments = userPublicKey ? await store.getPaymentsByUser(userPublicKey) : await store.getAllPayments();
  const tasks = userPublicKey ? await store.getTasksByUser(userPublicKey) : await store.getAllTasks();


  // === Gateway Metrics (user-created APIs only, excludes seeded catalog/playground APIs) ===
  const userApis = apis.filter(a => !!a.owner);
  const userApiIds = new Set(userApis.map(a => a.id));
  const activeUserApis = userApis.filter(a => a.status === 'active').length;

  const manualPayments = payments.filter(p => p.callerType === 'manual');
  const agentPayments = payments.filter(p => p.callerType === 'agent');

  // Only count manual payments that target user-created APIs
  const userManualPayments = manualPayments.filter(p => userApiIds.has(p.apiId));

  const totalManualCalls = userApis.reduce((s, a) => s + a.callCount, 0);
  const totalManualRevenue = userApis.reduce((s, a) => s + a.totalRevenue, 0);

  const toSummary = (a: typeof apis[0]): ApiSummary => ({
    id: a.id, name: a.name, slug: a.slug, price: a.price,
    callCount: a.callCount,
    totalRevenue: a.totalRevenue,
    status: a.status,
  });

  const manualPaymentsByStatus: Record<string, number> = {
    pending: 0, submitted: 0, verified: 0, consumed: 0, expired: 0, failed: 0,
  };
  userManualPayments.forEach(p => { manualPaymentsByStatus[p.status] = (manualPaymentsByStatus[p.status] || 0) + 1; });

  const gateway: GatewayMetrics = {
    totalApis: userApis.length,
    activeApis: activeUserApis,
    totalCalls: totalManualCalls,
    totalRevenue: totalManualRevenue,
    avgPricePerCall: totalManualCalls > 0 ? totalManualRevenue / totalManualCalls : 0,
    topApisByRevenue: [...userApis].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5).map(toSummary),
    topApisByCalls: [...userApis].sort((a, b) => b.callCount - a.callCount).slice(0, 5).map(toSummary),
    manualPayments: computePaymentSubset(userManualPayments),
    manualPaymentsByStatus,
  };

  // === Playground Metrics ===
  const tasksByStatus: Record<string, number> = {
    pending: 0, decomposing: 0, executing: 0, completed: 0, failed: 0,
  };
  tasks.forEach(t => { tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1; });

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const failedTasks = tasks.filter(t => t.status === 'failed');
  const finishedCount = completedTasks.length + failedTasks.length;

  const durations = completedTasks
    .filter(t => t.completedAt)
    .map(t => new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime());

  const roleDistribution: Record<string, number> = {};
  tasks.forEach(t => t.agents.forEach(a => {
    roleDistribution[a.role] = (roleDistribution[a.role] || 0) + 1;
  }));

  const tasksWithApiCalls = tasks.filter(t =>
    t.steps.some(s => s.requiresApi)
  ).length;

  const playground: PlaygroundMetrics = {
    totalTasks: tasks.length,
    tasksByStatus,
    completionRate: finishedCount > 0 ? completedTasks.length / finishedCount : 0,
    avgStepsPerTask: tasks.length > 0
      ? tasks.reduce((s, t) => s + t.steps.length, 0) / tasks.length
      : 0,
    avgCostPerTask: completedTasks.length > 0
      ? completedTasks.reduce((s, t) => s + t.totalSpent, 0) / completedTasks.length
      : 0,
    avgDurationMs: durations.length > 0
      ? durations.reduce((s, d) => s + d, 0) / durations.length
      : 0,
    totalAgentSpend: tasks.reduce((s, t) => s + t.totalSpent, 0),
    agentPayments: computePaymentSubset(agentPayments),
    roleDistribution,
    tasksWithApiCalls,
  };

  // === Overview Metrics ===
  const paymentsByStatus: Record<string, number> = {
    pending: 0, submitted: 0, verified: 0, consumed: 0, expired: 0, failed: 0,
  };
  payments.forEach(p => { paymentsByStatus[p.status] = (paymentsByStatus[p.status] || 0) + 1; });

  const settledAll = payments.filter(p => p.status !== 'pending');
  const successfulAll = payments.filter(p => p.status === 'verified' || p.status === 'consumed');

  const overview: OverviewMetrics = {
    totalUsdcFlow: successfulAll.reduce((s, p) => s + p.amount, 0),
    walletBalance: completedTasks.length > 0
      ? completedTasks.reduce((s, t) => s + t.totalSpent, 0) / completedTasks.length
      : 0,
    paymentSuccessRate: settledAll.length > 0 ? successfulAll.length / settledAll.length : 0,
    totalPayments: payments.length,
    paymentsByStatus,
    paymentsByCallerType: {
      manual: manualPayments.length,
      agent: agentPayments.length,
    },
  };

  const stats: EnhancedDashboardStats = {
    overview,
    gateway,
    playground,
    recentLogs: userPublicKey ? await store.getRecentLogsByUser(userPublicKey, 30) : await store.getRecentLogs(30),
    recentPayments: payments.slice(0, 10),
  };

  res.json(stats);
});
