import { useState } from 'react';
import { LogEntry } from '../../types';

interface ActivityFeedProps {
  logs: LogEntry[];
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
}

const levelColors: Record<string, string> = {
  info: 'text-text-secondary',
  warn: 'text-status-warning',
  error: 'text-status-error',
  payment: 'text-accent',
  agent: 'text-status-success',
};

const LEVELS = ['all', 'info', 'warn', 'error', 'payment', 'agent'] as const;

export function ActivityFeed({ logs }: ActivityFeedProps) {
  const [filter, setFilter] = useState<string>('all');
  const filtered = filter === 'all' ? logs : logs.filter(l => l.level === filter);

  return (
    <div className="bg-bg-secondary border border-border overflow-hidden h-full">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-[9px] font-mono font-medium text-text-secondary uppercase tracking-[0.2em]">
          Activity Feed
        </h2>
        <div className="flex gap-1">
          {LEVELS.map(level => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 transition-colors duration-[80ms] ${
                filter === level
                  ? 'text-accent bg-accent/10'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
      <div className="h-80 overflow-y-auto p-4 font-mono text-xs space-y-0.5">
        {filtered.length === 0 && (
          <p className="text-text-tertiary text-center py-8">No activity yet</p>
        )}
        {filtered.map((log, i) => (
          <div key={i} className="flex gap-2 leading-relaxed">
            <span className="text-text-tertiary shrink-0">{formatTime(log.timestamp)}</span>
            <span className={`shrink-0 ${levelColors[log.level] || 'text-text-secondary'}`}>
              [{log.source}]
            </span>
            <span className="text-text-secondary">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
