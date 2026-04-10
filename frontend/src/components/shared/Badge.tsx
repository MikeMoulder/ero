import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'pending' | 'info' | 'neutral';
  children: React.ReactNode;
}

const variants = {
  success: 'text-status-success border-status-success/20 bg-status-success/8',
  warning: 'text-status-warning border-status-warning/20 bg-status-warning/8',
  error: 'text-status-error border-status-error/20 bg-status-error/8',
  pending: 'text-text-tertiary border-border bg-bg-tertiary',
  info: 'text-accent border-accent/20 bg-accent/8',
  neutral: 'text-text-secondary border-border bg-bg-surface',
};

export function Badge({ variant = 'pending', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium tracking-wider uppercase border ${variants[variant]}`}>
      {children}
    </span>
  );
}
