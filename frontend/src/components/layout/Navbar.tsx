import { NavItem } from './NavItem';
import { StatusDot } from '../shared/StatusDot';
import { Button } from '../shared/Button';
import { useWallet } from '../../context/WalletContext';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import * as freighter from '../../services/freighter';
import { LayoutDashboard, Server, Terminal, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function Navbar() {
  const wallet = useWallet();
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [faucetLoading, setFaucetLoading] = useState(false);

  useEffect(() => {
    if (wallet.publicKey) {
      api.getBalance(wallet.publicKey)
        .then((info: any) => setUserBalance(info.balance))
        .catch(() => setUserBalance(null));
    } else {
      setUserBalance(null);
    }
  }, [wallet.publicKey]);

  const handleFaucet = async () => {
    if (!wallet.publicKey || faucetLoading) return;
    setFaucetLoading(true);
    try {
      const result = await api.requestFaucet(wallet.publicKey, 1000);
      if (result.step === 'sign_trustline' && result.unsignedTrustlineTxXdr) {
        const signed = await freighter.signTx(result.unsignedTrustlineTxXdr);
        await api.submitFaucet(signed, wallet.publicKey!, result.amount);
      }
      // Refresh balance
      const info = await api.getBalance(wallet.publicKey!);
      setUserBalance((info as any).balance);
    } catch (err: any) {
      console.warn('Faucet failed:', err.message);
    }
    setFaucetLoading(false);
  };

  const agentBalance = wallet.agentWallet?.balance ?? null;

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-bg-secondary/95 backdrop-blur-sm border-b border-border z-50 flex items-center px-6">
      {/* Brand */}
      <Link to="/" className="flex items-baseline gap-0.5 mr-8 shrink-0">
        <span className="text-lg font-display font-bold text-text-primary tracking-tight">ero</span>
        <span className="text-lg font-display font-bold text-accent">.</span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        <NavItem to="/dashboard" label="Dashboard" icon={<LayoutDashboard size={13} />} />
        <NavItem to="/gateway" label="Gateway" icon={<Server size={13} />} />
        <NavItem to="/playground" label="Playground" icon={<Terminal size={13} />} />
        <NavItem to="/payments" label="Payments" icon={<Wallet size={13} />} />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Wallet section */}
      <div className="flex items-center gap-4 shrink-0">
        {wallet.connected ? (
          <>
            {/* Agent wallet */}
            <div className="hidden md:flex items-center gap-2 border-r border-border pr-4">
              <span className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.15em]">Agent</span>
              {agentBalance !== null ? (
                <span className="text-[11px] font-mono text-accent">{agentBalance.toFixed(2)} USDC</span>
              ) : wallet.agentWallet && !wallet.agentWallet.activated ? (
                <span className="text-[9px] font-mono text-status-warning">Inactive</span>
              ) : null}
            </div>

            {/* User wallet */}
            <div className="flex items-center gap-2">
              <StatusDot status="active" />
              <span className="text-[11px] font-mono text-text-primary">
                {truncateAddress(wallet.publicKey!)}
              </span>
              {userBalance !== null && (
                <span className="text-[11px] font-mono text-accent hidden sm:inline">
                  {userBalance.toFixed(2)} USDC
                </span>
              )}
              <button
                onClick={handleFaucet}
                disabled={faucetLoading}
                className="text-[9px] font-mono text-accent hover:text-text-primary border border-accent/30 px-2 py-0.5 transition-colors duration-[80ms] disabled:opacity-50"
              >
                {faucetLoading ? '...' : 'Get USDC'}
              </button>
            </div>

            <button
              onClick={wallet.disconnect}
              className="text-[9px] font-mono text-text-tertiary hover:text-status-error transition-colors duration-[80ms] uppercase tracking-[0.15em]"
            >
              Disconnect
            </button>
          </>
        ) : (
          <Button size="sm" onClick={wallet.connect} loading={wallet.connecting}>
            Connect Wallet
          </Button>
        )}
      </div>
    </nav>
  );
}
