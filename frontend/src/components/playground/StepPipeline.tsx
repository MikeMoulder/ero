import { useState } from 'react';
import { TaskStep, PaymentFlowState } from '../../types';
import { PaymentFlowViz } from './PaymentFlowViz';
import { AnimatePresence, motion } from 'framer-motion';

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

function formatStepData(data: unknown): string {
  if (data === null || data === undefined || data === '') return 'No data available.';
  if (typeof data === 'string') return data;

  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

function getStepPreview(step: TaskStep): string {
  if (step.output === null || step.output === undefined) return 'Open for full execution details.';

  const text = typeof step.output === 'string'
    ? step.output
    : JSON.stringify(step.output);

  if (text.length <= 120) return text;
  return `${text.slice(0, 120)}...`;
}

export function StepPipeline({ steps, activePayment }: StepPipelineProps) {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const expandedStep = steps.find((step) => step.id === expandedStepId) ?? null;

  return (
    <div className="bg-bg-secondary border border-border p-5 mb-3">
      <h2 className="text-[9px] font-mono font-medium mb-4 text-text-secondary uppercase tracking-[0.2em]">Execution Pipeline</h2>
      <div className="flex items-start gap-2 overflow-x-auto pb-2">
        {steps.map((step, i) => {
          const cfg = stepStatusConfig[step.status];
          const hasActivePayment = activePayment && activePayment.stepId === step.id;
          const hasDetails = step.input !== null || step.output !== null || (step.logs?.length ?? 0) > 0;
          const isExpanded = expandedStepId === step.id;

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
                  {(step.status === 'completed' || step.status === 'failed') && hasDetails && (
                    <button
                      type="button"
                      onClick={() => setExpandedStepId((current) => current === step.id ? null : step.id)}
                      className="mt-2 w-full border border-status-success/20 bg-status-success/[0.03] p-2 text-left transition-colors duration-[80ms] hover:border-status-success/40"
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[8px] font-mono text-status-success uppercase tracking-wider">Result</span>
                        <span className="text-[8px] font-mono text-accent uppercase tracking-wider">
                          {isExpanded ? 'Collapse' : 'View details'}
                        </span>
                      </div>
                      <p className="text-[9px] font-mono text-text-secondary mt-0.5 line-clamp-2">
                        {getStepPreview(step)}
                      </p>
                    </button>
                  )}
                </div>

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

      <AnimatePresence>
        {expandedStep && (
          <motion.div
            key={expandedStep.id}
            initial={{ opacity: 0, height: 0, y: 8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-4 overflow-hidden border border-accent/30 bg-bg-primary"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-accent">Detailed Result View</p>
                <p className="text-sm font-mono text-text-primary mt-1">
                  {expandedStep.agentName || 'Agent'} · Step {expandedStep.index + 1}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedStepId(null)}
                className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary transition-colors duration-[80ms] hover:text-accent"
              >
                Collapse
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border-b border-border">
              <div className="bg-bg-secondary px-4 py-3">
                <div className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em] mb-1">Status</div>
                <div className="text-sm font-mono text-text-primary capitalize">{expandedStep.status.replace('_', ' ')}</div>
              </div>
              <div className="bg-bg-secondary px-4 py-3">
                <div className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em] mb-1">Cost</div>
                <div className="text-sm font-mono text-accent">{expandedStep.estimatedCost.toFixed(4)} USDC</div>
              </div>
              <div className="bg-bg-secondary px-4 py-3">
                <div className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em] mb-1">API</div>
                <div className="text-sm font-mono text-text-primary truncate">{expandedStep.apiEndpoint || 'None'}</div>
              </div>
              <div className="bg-bg-secondary px-4 py-3">
                <div className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em] mb-1">Logs</div>
                <div className="text-sm font-mono text-text-primary">{expandedStep.logs?.length ?? 0}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 p-4">
              <div className="border border-border bg-bg-secondary min-h-[180px]">
                <div className="px-3 py-2 border-b border-border text-[9px] font-mono uppercase tracking-[0.2em] text-text-tertiary">Input</div>
                <pre className="p-3 text-[10px] font-mono text-text-secondary whitespace-pre-wrap break-words overflow-x-auto max-h-[280px]">{formatStepData(expandedStep.input)}</pre>
              </div>
              <div className="border border-border bg-bg-secondary min-h-[180px]">
                <div className="px-3 py-2 border-b border-border text-[9px] font-mono uppercase tracking-[0.2em] text-text-tertiary">Output</div>
                <pre className="p-3 text-[10px] font-mono text-text-secondary whitespace-pre-wrap break-words overflow-x-auto max-h-[280px]">{formatStepData(expandedStep.output)}</pre>
              </div>
            </div>

            {(expandedStep.logs?.length ?? 0) > 0 && (
              <div className="px-4 pb-4">
                <div className="border border-border bg-bg-secondary">
                  <div className="px-3 py-2 border-b border-border text-[9px] font-mono uppercase tracking-[0.2em] text-text-tertiary">Recent Logs</div>
                  <div className="max-h-[220px] overflow-y-auto divide-y divide-border">
                    {expandedStep.logs.slice(-6).map((log, index) => (
                      <div key={`${log.timestamp}-${index}`} className="px-3 py-2">
                        <div className="flex items-center justify-between gap-3 text-[9px] font-mono text-text-tertiary mb-1">
                          <span>{log.source}</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[10px] font-mono text-text-secondary whitespace-pre-wrap break-words">{log.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
