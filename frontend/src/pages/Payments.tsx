import { useCallback } from 'react';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import { PaymentRequest, WSEvent } from '../types';
import { Badge } from '../components/shared/Badge';

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function truncate(str: string | null, len: number = 12) {
  if (!str) return '-';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'verified': return 'success' as const;
    case 'failed': case 'expired': return 'error' as const;
    case 'submitted': return 'warning' as const;
    default: return 'pending' as const;
  }
};

export default function Payments() {
  const { data: payments, setData } = useApi<PaymentRequest[]>(() => api.getPayments() as Promise<PaymentRequest[]>);

  const handleWS = useCallback((event: WSEvent) => {
    if (event.type === 'payment_update') {
      setData(prev => {
        if (!prev) return [event.payload];
        const idx = prev.findIndex(p => p.id === event.payload.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = event.payload;
          return updated;
        }
        return [event.payload, ...prev];
      });
    }
  }, [setData]);

  useWebSocket(handleWS);

  return (
    <div>
      <h1 className="text-xl font-display font-bold mb-6 tracking-tight">Payments</h1>

      <div className="bg-bg-secondary border border-border overflow-hidden">
        {(!payments || payments.length === 0) ? (
          <p className="text-text-tertiary text-xs text-center py-16 font-mono">No payments recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[9px] text-text-tertiary uppercase tracking-[0.15em] border-b border-border font-mono">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">API</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Tx Hash</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Verified</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-white/[0.02] transition-colors duration-[80ms]">
                    <td className="px-5 py-3 font-mono text-[10px] text-text-tertiary">{truncate(p.id, 8)}</td>
                    <td className="px-5 py-3 text-text-primary font-mono">{p.apiName}</td>
                    <td className="px-5 py-3 font-mono text-accent">{p.amount} USDC</td>
                    <td className="px-5 py-3">
                      <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={p.callerType === 'agent' ? 'info' : 'pending'}>{p.callerType}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      {p.txHash ? (
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${p.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[10px] text-accent hover:underline"
                        >
                          {truncate(p.txHash, 12)}
                        </a>
                      ) : (
                        <span className="text-text-tertiary text-[10px]">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[10px] text-text-secondary font-mono">{formatTime(p.createdAt)}</td>
                    <td className="px-5 py-3 text-[10px] text-text-secondary font-mono">
                      {p.verifiedAt ? formatTime(p.verifiedAt) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
