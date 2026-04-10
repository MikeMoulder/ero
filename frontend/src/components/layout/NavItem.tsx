import { NavLink } from 'react-router-dom';

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export function NavItem({ to, label, icon }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono transition-colors duration-[80ms] border-b-2 ${
          isActive
            ? 'text-accent border-accent'
            : 'text-text-secondary hover:text-text-primary border-transparent'
        }`
      }
    >
      {icon}
      <span className="uppercase tracking-[0.08em]">{label}</span>
    </NavLink>
  );
}
