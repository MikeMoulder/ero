import { NavItem } from './NavItem';
import { StatusDot } from '../shared/StatusDot';
import { Button } from '../shared/Button';
import { useWallet } from '../../context/WalletContext';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { LayoutDashboard, Server, Terminal, Wallet } from 'lucide-react';

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function Sidebar() {
  const wallet = useWallet();
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [agentBalance, setAgentBalance] = useState<number | null>(null);

  useEffect(() => {
    api.getAgentWallet()
      .then((info: any) => setAgentBalance(info.balance))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (wallet.publicKey) {
      api.getBalance(wallet.publicKey)
        .then((info: any) => setUserBalance(info.balance))
        .catch(() => setUserBalance(null));
    } else {
      setUserBalance(null);
    }
  }, [wallet.publicKey]);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-bg-secondary border-r border-border flex flex-col z-40">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-baseline gap-0.5">
          <span className="text-xl font-display font-bold text-text-primary tracking-tight">ero</span>
          <span className="text-xl font-display font-bold text-accent animate-orange-bleed">.</span>
        </div>
        <p className="text-[9px] text-text-tertiary mt-1.5 font-mono uppercase tracking-[0.2em]">x402 agent gateway</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <NavItem to="/dashboard" label="Dashboard" icon={<LayoutDashboard size={14} />} />
        <NavItem to="/gateway" label="API Gateway" icon={<Server size={14} />} />
        <NavItem to="/playground" label="Playground" icon={<Terminal size={14} />} />
        <NavItem to="/payments" label="Payments" icon={<Wallet size={14} />} />
      </nav>

      {/* Wallet Section */}
      <div className="px-4 py-4 border-t border-border space-y-3">
        {wallet.connected ? (
          <>
            <div>
              <div className="flex items-center gap-2">
                <StatusDot status="active" />
                <span className="text-[11px] text-text-primary font-mono">
                  {truncateAddress(wallet.publicKey!)}
                </span>
              </div>
              {userBalance !== null && (
                <p className="text-[11px] text-accent mt-1 ml-4 font-mono">
                  {userBalance.toFixed(2)} USDC
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-[9px] text-text-tertiary uppercase tracking-[0.2em]">Agent Wallet</p>
              {agentBalance !== null && (
                <p className="text-[11px] text-accent font-mono mt-0.5">
                  {agentBalance.toFixed(2)} USDC
                </p>
              )}
            </div>

            <button
              onClick={wallet.disconnect}
              className="text-[9px] text-text-tertiary hover:text-status-error transition-colors duration-[80ms] uppercase tracking-[0.15em] font-mono"
            >
              Disconnect
            </button>
          </>
        ) : (
          <Button
            size="sm"
            onClick={wallet.connect}
            loading={wallet.connecting}
            className="w-full"
          >
            Connect Wallet
          </Button>
        )}
      </div>
    </aside>
  );
}
