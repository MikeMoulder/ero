interface StatusDotProps {
  status: 'active' | 'inactive' | 'pending' | 'error';
  size?: 'sm' | 'md';
}

const colors = {
  active: 'bg-status-success',
  inactive: 'bg-text-tertiary',
  pending: 'bg-status-warning',
  error: 'bg-status-error',
};

export function StatusDot({ status, size = 'sm' }: StatusDotProps) {
  const sizeClass = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  return (
    <span
      className={`inline-block rounded-full ${sizeClass} ${colors[status]} ${status === 'active' ? 'animate-pulse-dot' : ''}`}
    />
  );
}
