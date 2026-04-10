import { TaskStep, PaymentFlowState } from '../../types';
import { PaymentFlowViz } from './PaymentFlowViz';
import { AnimatePresence } from 'framer-motion';

const stepStatusConfig: Record<string, { color: string; bg: string }> = {
  pending: { color: 'border-border text-text-tertiary', bg: 'bg-bg-tertiary' },
  in_progress: { color: 'border-accent text-accent', bg: 'bg-accent/10' },
  completed: { color: 'border-status-success text-status-success', bg: 'bg-status-success/10' },
  failed: { color: 'border-status-error text-status-error', bg: 'bg-status-error/10' },
};

interface StepPipelineProps {
  steps: TaskStep[];
  activePayment: PaymentFlowState | null;
}

export function StepPipeline({ steps, activePayment }: StepPipelineProps) {
  return (
    <div className="bg-bg-secondary border border-border p-5 mb-3">
      <h2 className="text-[9px] font-mono font-medium mb-4 text-text-secondary uppercase tracking-[0.2em]">Execution Pipeline</h2>
      <div className="flex items-start gap-2 overflow-x-auto pb-2">
        {steps.map((step, i) => {
          const cfg = stepStatusConfig[step.status];
          const hasActivePayment = activePayment && activePayment.stepId === step.id;

          return (
            <div key={step.id} className="flex items-start gap-2">
              <div className="shrink-0 w-52">
                <div className={`border ${cfg.color} p-4 ${cfg.bg}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-5 h-5 flex items-center justify-center text-[10px] font-mono font-medium border ${cfg.color}`}>
                      {i + 1}
                    </div>
                    <span className="text-[10px] font-mono font-medium uppercase tracking-wider">{step.agentName || 'Agent'}</span>
                    {step.status === 'in_progress' && (
                      <span className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spinner" />
                    )}
                  </div>
                  <p className="text-[10px] text-text-secondary leading-relaxed font-mono">{step.description}</p>
                  {step.requiresApi && step.apiEndpoint && (
                    <p className="text-[10px] font-mono text-accent mt-2 break-all">/x402{step.apiEndpoint}</p>
                  )}
                  {step.estimatedCost > 0 && step.status === 'pending' && (
                    <p className="text-[9px] font-mono text-status-warning mt-1">{step.estimatedCost.toFixed(4)} USDC</p>
                  )}
                  {step.status === 'completed' && step.startedAt && step.completedAt && (
                    <p className="text-[9px] font-mono text-text-tertiary mt-1">
                      {((new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime()) / 1000).toFixed(1)}s
                    </p>
                  )}
                  {step.status === 'completed' && step.output && (
                    <div className="mt-2 border border-status-success/20 bg-status-success/[0.03] p-2">
                      <span className="text-[8px] font-mono text-status-success uppercase tracking-wider">Result</span>
                      <p className="text-[9px] font-mono text-text-secondary mt-0.5 line-clamp-2">
                        {typeof step.output === 'string' ? step.output.slice(0, 120) : JSON.stringify(step.output).slice(0, 120)}...
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment flow visualization — rendered inline below the step card */}
                <AnimatePresence>
                  {hasActivePayment && activePayment && (
                    <PaymentFlowViz payment={activePayment} />
                  )}
                </AnimatePresence>
              </div>

              {i < steps.length - 1 && (
                <div className="flex items-center self-center pt-4">
                  <svg width="20" height="8" viewBox="0 0 20 8" fill="none" stroke="currentColor" strokeWidth="1" className="text-text-tertiary">
                    <path d="M0 4h16M13 1l3 3-3 3" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
