interface MetricCardProps {
  label: string;
  value: string | number;
  annotation?: string;
  accent?: boolean;
  status?: 'success' | 'warning' | 'error';
}

const statusColors: Record<string, string> = {
  success: 'text-status-success',
  warning: 'text-status-warning',
  error: 'text-status-error',
};

export function MetricCard({ label, value, annotation, accent, status }: MetricCardProps) {
  const valueColor = status
    ? statusColors[status]
    : accent
    ? 'text-accent'
    : 'text-text-primary';

  return (
    <div className="bg-bg-secondary border border-border p-5 hover:border-accent/40 transition-colors duration-[80ms]">
      <p className="text-[9px] text-text-tertiary uppercase tracking-[0.2em] mb-2 font-mono font-medium">
        {label}
      </p>
      <p className={`text-2xl font-medium font-mono ${valueColor}`}>{value}</p>
      {annotation && (
        <p className="text-[10px] font-mono text-text-tertiary mt-1">{annotation}</p>
      )}
    </div>
  );
}
