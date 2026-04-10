import { ReactNode } from 'react';

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  badge?: string;
}

export function SectionHeader({ icon, title, badge }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4 border-l-[3px] border-accent pl-3">
      <span className="text-accent">{icon}</span>
      <h2 className="text-xs font-display font-bold uppercase tracking-[0.15em] text-text-primary">
        {title}
      </h2>
      {badge && (
        <span className="text-[9px] font-mono text-text-tertiary bg-bg-tertiary px-2 py-0.5 uppercase tracking-wider">
          {badge}
        </span>
      )}
    </div>
  );
}
