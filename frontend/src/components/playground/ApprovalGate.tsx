import { motion } from 'framer-motion';
import { TaskStep } from '../../types';
import { Badge } from '../shared/Badge';
import { Button } from '../shared/Button';

interface ApprovalGateProps {
  steps: TaskStep[];
  totalEstimatedCost: number;
  agentBalance: number;
  onDecision: (decision: 'approve' | 'deny' | 'approve_always') => void;
  loading: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  datafetcher: 'Retrieval',
  summarizer: 'Summary',
  verifier: 'Verify',
  analyst: 'Analysis',
};

export function ApprovalGate({ steps, totalEstimatedCost, agentBalance, onDecision, loading }: ApprovalGateProps) {
  const insufficientBalance = agentBalance < totalEstimatedCost;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-bg-secondary border border-accent/30 p-5 mb-3 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-status-warning rounded-full animate-pulse" />
          <span className="text-[9px] font-mono text-status-warning uppercase tracking-[0.2em] font-medium">
            approval required
          </span>
        </div>
        <span className="text-[10px] font-mono text-text-tertiary">
          {steps.length} steps &middot; {steps.filter(s => s.requiresApi).length} API calls
        </span>
      </div>

      {/* Step Breakdown */}
      <div className="space-y-1.5 mb-4">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className="flex items-center gap-3 py-2 px-3 bg-bg-primary border border-border"
          >
            <span className="text-[10px] font-mono text-text-tertiary w-5 shrink-0">
              {i + 1}.
            </span>
            <Badge variant={step.requiresApi ? 'info' : 'neutral'}>
              {ROLE_LABELS[step.agentName?.toLowerCase() || ''] || step.agentName || 'Agent'}
            </Badge>
            <span className="text-[11px] font-mono text-text-secondary flex-1 truncate">
              {step.description}
            </span>
            {step.requiresApi && step.apiEndpoint && (
              <span className="text-[9px] font-mono text-accent shrink-0 max-w-[200px] truncate">
                /x402{step.apiEndpoint}
              </span>
            )}
            <span className={`text-[10px] font-mono shrink-0 w-16 text-right ${step.estimatedCost > 0 ? 'text-status-warning' : 'text-text-tertiary'}`}>
              {step.estimatedCost > 0 ? `${step.estimatedCost.toFixed(4)}` : 'free'}
            </span>
          </div>
        ))}
      </div>

      {/* Cost Summary */}
      <div className="flex items-center justify-between py-3 px-3 border border-border bg-bg-primary mb-4">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[8px] font-mono text-text-tertiary uppercase tracking-[0.15em] block">Total Estimated</span>
            <span className="text-sm font-mono text-accent font-medium">
              {totalEstimatedCost.toFixed(4)} USDC
            </span>
          </div>
          <div>
            <span className="text-[8px] font-mono text-text-tertiary uppercase tracking-[0.15em] block">Agent Balance</span>
            <span className={`text-sm font-mono font-medium ${insufficientBalance ? 'text-status-error' : 'text-status-success'}`}>
              {agentBalance.toFixed(2)} USDC
            </span>
          </div>
        </div>
        {insufficientBalance && (
          <span className="text-[10px] font-mono text-status-error">
            Insufficient balance
          </span>
        )}
      </div>

      {/* Decision Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="success"
          size="sm"
          onClick={() => onDecision('approve')}
          disabled={loading || insufficientBalance}
          loading={loading}
        >
          Approve
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDecision('deny')}
          disabled={loading}
        >
          Deny
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onDecision('approve_always')}
          disabled={loading || insufficientBalance}
        >
          Approve Always
        </Button>
        <span className="text-[9px] font-mono text-text-tertiary ml-2">
          "Approve Always" skips this gate for future tasks
        </span>
      </div>
    </motion.div>
  );
}
