import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import { useWallet } from '../context/WalletContext';
import { EnhancedDashboardStats, LogEntry, WSEvent } from '../types';
import { OverviewBar } from '../components/dashboard/OverviewBar';
import { GatewaySection } from '../components/dashboard/GatewaySection';
import { PlaygroundSection } from '../components/dashboard/PlaygroundSection';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { RecentPayments } from '../components/dashboard/RecentPayments';

export default function Dashboard() {
  const wallet = useWallet();
  const { data: stats, setData: setStats } = useApi<EnhancedDashboardStats>(
    () => api.getStats(wallet.publicKey || undefined) as Promise<EnhancedDashboardStats>,
    [wallet.publicKey]
  );
  const [liveLogs, setLiveLogs] = useState<LogEntry[]>([]);

  const handleWS = useCallback((event: WSEvent) => {
    if (event.type === 'log') {
      setLiveLogs(prev => [...prev.slice(-99), event.payload]);
    }
    if (event.type === 'stats_update') {
      setStats(prev => {
        if (!prev) return prev;
        const p = event.payload;
        return {
          ...prev,
          overview: p.overview ? { ...prev.overview, ...p.overview } : prev.overview,
          gateway: p.gateway ? { ...prev.gateway, ...p.gateway } : prev.gateway,
          playground: p.playground ? { ...prev.playground, ...p.playground } : prev.playground,
          recentLogs: p.recentLogs ?? prev.recentLogs,
          recentPayments: p.recentPayments ?? prev.recentPayments,
        };
      });
    }
  }, [setStats]);

  useWebSocket(handleWS, wallet.publicKey);

  const allLogs = [...(stats?.recentLogs || []), ...liveLogs];
  const uniqueLogs = allLogs.filter((log, i, arr) =>
    arr.findIndex(l => l.timestamp === log.timestamp && l.message === log.message) === i
  ).slice(-50);

  // Default empty state
  const overview = stats?.overview ?? {
    totalUsdcFlow: 0, walletBalance: 0, paymentSuccessRate: 0,
    totalPayments: 0, paymentsByStatus: {}, paymentsByCallerType: { manual: 0, agent: 0 },
  };
  const gateway = stats?.gateway ?? {
    totalApis: 0, activeApis: 0, totalCalls: 0, totalRevenue: 0,
    avgPricePerCall: 0, topApisByRevenue: [], topApisByCalls: [],
    manualPayments: { count: 0, totalAmount: 0, successRate: 0 },
    manualPaymentsByStatus: {},
  };
  const playground = stats?.playground ?? {
    totalTasks: 0, tasksByStatus: {}, completionRate: 0,
    avgStepsPerTask: 0, avgCostPerTask: 0, avgDurationMs: 0,
    totalAgentSpend: 0, agentPayments: { count: 0, totalAmount: 0, successRate: 0 },
    roleDistribution: {}, tasksWithApiCalls: 0,
  };

  return (
    <div>
      <h1 className="text-xl font-display font-bold mb-6 tracking-tight">Dashboard</h1>

      {/* Overview Metrics */}
      <div className="mb-6">
        <OverviewBar overview={overview} />
      </div>

      {/* Product Sections: Gateway | Playground */}
      <div className="grid grid-cols-12 gap-3 mb-6">
        <div className="col-span-12 lg:col-span-6">
          <GatewaySection
            gateway={gateway}
          />
        </div>
        <div className="col-span-12 lg:col-span-6">
          <PlaygroundSection playground={playground} />
        </div>
      </div>

      {/* Activity Feed + Recent Payments */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 lg:col-span-8">
          <ActivityFeed logs={uniqueLogs} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <RecentPayments payments={stats?.recentPayments || []} />
        </div>
      </div>
    </div>
  );
}
