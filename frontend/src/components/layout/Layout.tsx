import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { WalletGate } from './WalletGate';
import { useWallet } from '../../context/WalletContext';

export function Layout() {
  const wallet = useWallet();

  if (!wallet.connected) {
    return <WalletGate />;
  }

  return (
    <div className="min-h-screen bg-bg-primary dot-matrix noise-grain">
      <div className="orange-bleed" />
      <Navbar />
      <main className="pt-20 px-8 pb-8 relative z-10 min-h-screen max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
