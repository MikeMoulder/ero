import { Terminal } from 'lucide-react';
import { PlaygroundMetrics } from '../../types';
import { SectionHeader } from './SectionHeader';
import { DonutRing } from './DonutRing';
import { HorizontalBarList } from './HorizontalBarList';

interface PlaygroundSectionProps {
  playground: PlaygroundMetrics;
}

const ROLE_NAMES: Record<string, string> = {
  data_retrieval: 'Data Retrieval',
  summarization: 'Summarization',
  verification: 'Verification',
  analysis: 'Analysis',
};

function formatDuration(ms: number): string {
  if (ms === 0) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function PlaygroundSection({ playground }: PlaygroundSectionProps) {
  const completionStatus = playground.completionRate >= 0.8
    ? 'success' as const
    : playground.completionRate >= 0.5
    ? 'warning' as const
    : playground.completionRate > 0
    ? 'error' as const
    : undefined;

  const donutSegments = [
    { label: 'Completed', value: playground.tasksByStatus.completed || 0, cssColor: 'var(--color-status-success)' },
    { label: 'Executing', value: playground.tasksByStatus.executing || 0, cssColor: 'var(--color-accent-primary)' },
    { label: 'Decomposing', value: playground.tasksByStatus.decomposing || 0, cssColor: 'var(--color-status-warning)' },
    { label: 'Failed', value: playground.tasksByStatus.failed || 0, cssColor: 'var(--color-status-error)' },
    { label: 'Pending', value: playground.tasksByStatus.pending || 0, cssColor: 'var(--color-status-pending)' },
  ];

  const roleItems = Object.entries(playground.roleDistribution).map(([role, count]) => ({
    label: ROLE_NAMES[role] || role,
    value: count,
    formattedValue: `${count}x`,
  }));

  return (
    <div className="bg-bg-secondary border border-border p-5">
      <SectionHeader
        icon={<Terminal size={14} />}
        title="Agent Playground"
        badge={`${playground.totalTasks} tasks`}
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div>
          <p className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em] mb-1">Tasks</p>
          <p className="text-lg font-mono font-medium text-text-primary">{playground.totalTasks}</p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em] mb-1">Completion</p>
          <p className={`text-lg font-mono font-medium ${
            completionStatus === 'success' ? 'text-status-success' :
            completionStatus === 'warning' ? 'text-status-warning' :
            completionStatus === 'error' ? 'text-status-error' :
            'text-text-primary'
          }`}>
            {(playground.completionRate * 100).toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em] mb-1">Avg Cost</p>
          <p className="text-lg font-mono font-medium text-accent">{playground.avgCostPerTask.toFixed(4)}</p>
          <p className="text-[9px] font-mono text-text-tertiary">USDC</p>
        </div>
      </div>

      {/* Task Status Donut */}
      <div className="border-t border-border pt-4 mb-5">
        <p className="text-[9px] font-mono text-text-secondary uppercase tracking-[0.2em] mb-3">
          Task Status
        </p>
        {playground.totalTasks > 0 ? (
          <DonutRing
            segments={donutSegments}
            size={110}
            strokeWidth={7}
            centerLabel={String(playground.totalTasks)}
          />
        ) : (
          <p className="text-text-tertiary text-[10px] font-mono text-center py-4">No tasks yet</p>
        )}
      </div>

      {/* Role Distribution */}
      {roleItems.length > 0 && (
        <div className="border-t border-border pt-4 mb-5">
          <p className="text-[9px] font-mono text-text-secondary uppercase tracking-[0.2em] mb-3">
            Agent Roles Used
          </p>
          <HorizontalBarList items={roleItems} emptyText="No agents used" />
        </div>
      )}

      {/* Inline stats */}
      <div className="border-t border-border pt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em] mb-1">Avg Steps</p>
          <p className="text-sm font-mono text-text-secondary">{playground.avgStepsPerTask.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em] mb-1">Avg Duration</p>
          <p className="text-sm font-mono text-text-secondary">{formatDuration(playground.avgDurationMs)}</p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em] mb-1">API Tasks</p>
          <p className="text-sm font-mono text-text-secondary">
            {playground.tasksWithApiCalls}/{playground.totalTasks}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em] mb-1">Agent Spend</p>
          <p className="text-sm font-mono text-accent">{playground.totalAgentSpend.toFixed(4)}</p>
        </div>
      </div>
    </div>
  );
}
