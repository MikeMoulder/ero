import { OverviewMetrics } from '../../types';
import { MetricCard } from './MetricCard';

interface OverviewBarProps {
  overview: OverviewMetrics;
}

export function OverviewBar({ overview }: OverviewBarProps) {
  const { manual, agent } = overview.paymentsByCallerType;
  const callerTotal = manual + agent;
  const manualPct = callerTotal > 0 ? (manual / callerTotal) * 100 : 50;

  const successStatus = overview.paymentSuccessRate >= 0.9
    ? 'success' as const
    : overview.paymentSuccessRate >= 0.7
    ? 'warning' as const
    : overview.paymentSuccessRate > 0
    ? 'error' as const
    : undefined;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-6 lg:col-span-3">
          <MetricCard
            label="Total USDC Flow"
            value={overview.totalUsdcFlow.toFixed(4)}
            annotation={`across ${overview.totalPayments} payments`}
            accent
          />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <MetricCard
            label="Avg Task Cost"
            value={`${overview.walletBalance.toFixed(4)} USDC`}
            accent
          />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <MetricCard
            label="Payment Success"
            value={`${(overview.paymentSuccessRate * 100).toFixed(0)}%`}
            status={successStatus}
          />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <MetricCard
            label="Total Payments"
            value={overview.totalPayments}
            annotation={`${manual} manual / ${agent} agent`}
          />
        </div>
      </div>

      {/* Caller type split bar */}
      {callerTotal > 0 && (
        <div className="bg-bg-secondary border border-border px-5 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em]">
              Manual: {manual}
            </span>
            <span className="text-[9px] font-mono text-accent uppercase tracking-[0.2em]">
              Agent: {agent}
            </span>
          </div>
          <div className="h-1 flex w-full overflow-hidden">
            <div
              className="h-full bg-text-secondary/40 transition-all duration-300"
              style={{ width: `${manualPct}%` }}
            />
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${100 - manualPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
