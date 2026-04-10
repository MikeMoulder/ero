import { motion } from 'framer-motion';
import { PaymentFlowState } from '../../types';

const PHASES = [
  { key: 'challenge', label: '402 RECEIVED' },
  { key: 'budget_check', label: 'BUDGET CHECK' },
  { key: 'sending', label: 'STELLAR TX' },
  { key: 'verifying', label: 'VERIFIED' },
  { key: 'unlocked', label: 'API UNLOCKED' },
] as const;

function getPhaseIndex(phase: PaymentFlowState['phase']): number {
  if (phase === 'failed') return -1;
  return PHASES.findIndex(p => p.key === phase);
}

interface PaymentFlowVizProps {
  payment: PaymentFlowState;
}

export function PaymentFlowViz({ payment }: PaymentFlowVizProps) {
  const activeIdx = getPhaseIndex(payment.phase);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="border border-accent/30 bg-accent/[0.03] p-4 mt-2 overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
        <span className="text-[9px] font-mono text-accent uppercase tracking-[0.2em]">x402 payment flow</span>
        <span className="text-[9px] font-mono text-text-tertiary ml-auto">{payment.amount.toFixed(2)} USDC</span>
      </div>

      {/* Phase nodes */}
      <div className="flex items-center gap-0">
        {PHASES.map((phase, idx) => {
          const isActive = idx === activeIdx;
          const isPast = idx < activeIdx;
          const isFuture = idx > activeIdx;
          const isFailed = payment.phase === 'failed' && idx === activeIdx;

          let borderColor = 'border-border';
          let textColor = 'text-text-tertiary';
          let bgColor = '';

          if (isFailed) {
            borderColor = 'border-status-error';
            textColor = 'text-status-error';
            bgColor = 'bg-status-error/5';
          } else if (isActive) {
            borderColor = 'border-accent';
            textColor = 'text-accent';
            bgColor = 'bg-accent/5';
          } else if (isPast) {
            borderColor = 'border-status-success';
            textColor = 'text-status-success';
            bgColor = 'bg-status-success/5';
          }

          return (
            <div key={phase.key} className="flex items-center flex-1 min-w-0">
              <motion.div
                className={`flex-1 border ${borderColor} ${bgColor} p-2.5 min-w-0 transition-colors duration-200`}
                animate={{
                  opacity: isFuture ? 0.3 : 1,
                  scale: isActive ? 1 : 0.98,
                }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {isActive && !isFailed && (
                    <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spinner shrink-0" />
                  )}
                  {isPast && (
                    <svg className="w-3 h-3 text-status-success shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 8l3.5 3.5L13 5" />
                    </svg>
                  )}
                  <span className={`text-[8px] font-mono font-medium ${textColor} uppercase tracking-wider truncate`}>
                    {phase.label}
                  </span>
                </div>

                {/* Phase-specific detail */}
                <div className="text-[9px] font-mono text-text-tertiary truncate">
                  {phase.key === 'challenge' && (isActive || isPast) && (
                    <span>{payment.agentName} &middot; {payment.amount} USDC{payment.apiEndpoint ? ` &middot; ${payment.apiEndpoint}` : ''}</span>
                  )}
                  {phase.key === 'budget_check' && isPast && (
                    <span className="text-status-success">approved</span>
                  )}
                  {phase.key === 'sending' && isActive && (
                    <span>broadcasting...</span>
                  )}
                  {phase.key === 'verifying' && payment.txHash && (isActive || isPast) && (
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${payment.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-accent-hover underline underline-offset-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {payment.txHash.slice(0, 6)}...{payment.txHash.slice(-4)}
                    </a>
                  )}
                  {phase.key === 'unlocked' && isPast && (
                    <span className="text-status-success">data received</span>
                  )}
                </div>
              </motion.div>

              {/* Connector arrow */}
              {idx < PHASES.length - 1 && (
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="shrink-0 mx-0.5">
                  <path
                    d="M0 4h8M6 1l2 3-2 3"
                    stroke={isPast ? 'var(--color-status-success)' : isActive ? 'var(--color-accent-primary)' : 'var(--color-border-default)'}
                    strokeWidth="1"
                  />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
