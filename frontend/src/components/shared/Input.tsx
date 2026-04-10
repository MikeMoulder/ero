import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[10px] text-text-secondary font-mono font-medium uppercase tracking-[0.15em]">{label}</label>
      )}
      <input
        className={`bg-bg-primary border border-border px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors duration-[80ms] ${className}`}
        {...props}
      />
    </div>
  );
}
