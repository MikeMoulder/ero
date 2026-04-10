import { Server } from 'lucide-react';
import { GatewayMetrics } from '../../types';
import { MetricCard } from './MetricCard';
import { SectionHeader } from './SectionHeader';
import { HorizontalBarList } from './HorizontalBarList';
import { StackedStatusBar } from './StackedStatusBar';

interface GatewaySectionProps {
  gateway: GatewayMetrics;
}

export function GatewaySection({ gateway }: GatewaySectionProps) {
  const topApis = gateway.topApisByRevenue.map(a => ({
    label: a.name,
    sublabel: `/${a.slug}`,
    value: a.totalRevenue,
    formattedValue: `${a.totalRevenue.toFixed(4)} USDC`,
  }));

  const paymentsByStatus = gateway.manualPaymentsByStatus || {};
  const statusSegments = [
    { label: 'Verified', value: paymentsByStatus.verified || 0, cssColor: 'var(--color-status-success)' },
    { label: 'Submitted', value: paymentsByStatus.submitted || 0, cssColor: 'var(--color-status-warning)' },
    { label: 'Pending', value: paymentsByStatus.pending || 0, cssColor: 'var(--color-status-pending)' },
    { label: 'Failed', value: paymentsByStatus.failed || 0, cssColor: 'var(--color-status-error)' },
    { label: 'Expired', value: paymentsByStatus.expired || 0, cssColor: 'var(--color-text-tertiary)' },
  ];

  return (
    <div className="bg-bg-secondary border border-border p-5">
      <SectionHeader
        icon={<Server size={14} />}
        title="x402 API Gateway"
        badge={`${gateway.activeApis} active`}
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div>
          <p className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em] mb-1">APIs</p>
          <p className="text-lg font-mono font-medium text-text-primary">{gateway.totalApis}</p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em] mb-1">Calls</p>
          <p className="text-lg font-mono font-medium text-text-primary">{gateway.totalCalls}</p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em] mb-1">Revenue</p>
          <p className="text-lg font-mono font-medium text-accent">{gateway.totalRevenue.toFixed(4)}</p>
          <p className="text-[9px] font-mono text-text-tertiary">USDC</p>
        </div>
      </div>

      {/* Avg price */}
      {gateway.avgPricePerCall > 0 && (
        <div className="border-t border-border pt-3 mb-5">
          <p className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em] mb-1">
            Avg Price / Call
          </p>
          <p className="text-sm font-mono text-text-secondary">{gateway.avgPricePerCall.toFixed(4)} USDC</p>
        </div>
      )}

      {/* Top APIs by Revenue */}
      <div className="border-t border-border pt-4 mb-5">
        <p className="text-[9px] font-mono text-text-secondary uppercase tracking-[0.2em] mb-3">
          Top APIs by Revenue
        </p>
        <HorizontalBarList items={topApis} emptyText="No APIs registered" />
      </div>

      {/* Payment Status Distribution */}
      <div className="border-t border-border pt-4">
        <p className="text-[9px] font-mono text-text-secondary uppercase tracking-[0.2em] mb-3">
          Payment Status
        </p>
        <StackedStatusBar segments={statusSegments} />
      </div>
    </div>
  );
}
