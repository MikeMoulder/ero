import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-mono font-medium tracking-wider uppercase transition-all duration-[80ms] ease-out focus:outline-none focus:ring-1 focus:ring-accent/40 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97] select-none';

  const variants = {
    primary: 'bg-accent border border-accent text-text-inverse hover:bg-accent-hover hover:border-accent-hover hover:pl-[calc(theme(spacing.5)+2px)] hover:pr-[calc(theme(spacing.5)-2px)]',
    secondary: 'bg-transparent border border-border text-text-primary hover:border-accent hover:text-accent',
    success: 'bg-status-success border border-status-success text-text-inverse hover:brightness-110',
    danger: 'bg-transparent border border-status-error text-status-error hover:bg-status-error hover:text-white',
    ghost: 'bg-transparent border border-transparent text-text-secondary hover:text-text-primary',
  };

  const sizes = {
    sm: 'px-3 py-1 text-[10px]',
    md: 'px-5 py-2 text-xs',
    lg: 'px-7 py-2.5 text-xs',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="animate-spinner mr-2 w-3 h-3 inline-block border-[1.5px] border-current border-t-transparent rounded-full" />
      )}
      {children}
    </button>
  );
}
