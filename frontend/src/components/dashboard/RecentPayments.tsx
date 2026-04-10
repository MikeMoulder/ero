import { PaymentRequest } from '../../types';
import { Badge } from '../shared/Badge';

interface RecentPaymentsProps {
  payments: PaymentRequest[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'verified': return 'success' as const;
    case 'failed': return 'error' as const;
    case 'submitted': return 'warning' as const;
    default: return 'pending' as const;
  }
};

export function RecentPayments({ payments }: RecentPaymentsProps) {
  return (
    <div className="bg-bg-secondary border border-border overflow-hidden h-full">
      <div className="px-5 py-3 border-b border-border">
        <h2 className="text-[9px] font-mono font-medium text-text-secondary uppercase tracking-[0.2em]">
          Recent Payments
        </h2>
      </div>
      <div className="p-4 space-y-3">
        {payments.length === 0 && (
          <p className="text-text-tertiary text-xs text-center py-8">No payments yet</p>
        )}
        {payments.slice(0, 7).map((payment) => (
          <div key={payment.id} className="flex items-center justify-between text-xs border-b border-border pb-3 last:border-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-text-primary font-mono">{payment.amount} USDC</p>
                <span className={`text-[8px] font-mono uppercase tracking-wider px-1 py-px ${
                  payment.callerType === 'agent'
                    ? 'text-accent bg-accent/10'
                    : 'text-text-tertiary bg-bg-tertiary'
                }`}>
                  {payment.callerType}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-text-tertiary text-[10px] truncate">{payment.apiName}</p>
                <span className="text-text-tertiary text-[9px]">{timeAgo(payment.createdAt)}</span>
              </div>
            </div>
            <Badge variant={statusVariant(payment.status)}>
              {payment.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
