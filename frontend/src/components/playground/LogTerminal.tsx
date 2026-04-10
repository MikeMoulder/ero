import { useEffect, useRef } from 'react';
import { LogEntry } from '../../types';

const levelColors: Record<string, string> = {
  info: 'text-text-secondary',
  warn: 'text-status-warning',
  error: 'text-status-error',
  payment: 'text-accent',
  agent: 'text-status-success',
};

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
}

interface LogTerminalProps {
  logs: LogEntry[];
}

export function LogTerminal({ logs }: LogTerminalProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="lg:col-span-3 bg-bg-primary border border-border overflow-hidden flex flex-col">
      <div className="px-4 py-2.5 border-b border-border">
        <span className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em]">execution log</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-0.5">
        {logs.length === 0 && (
          <p className="text-text-tertiary">waiting for task execution...</p>
        )}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2 leading-relaxed">
            <span className="text-text-tertiary shrink-0">{formatTime(log.timestamp)}</span>
            <span className={`shrink-0 ${levelColors[log.level]}`}>[{log.source}]</span>
            <span className="text-text-secondary">{log.message}</span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
