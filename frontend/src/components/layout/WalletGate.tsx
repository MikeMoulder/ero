import { Link } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { Button } from '../shared/Button';
import { motion } from 'framer-motion';

export function WalletGate() {
  const wallet = useWallet();

  return (
    <div className="min-h-screen bg-bg-primary dot-matrix noise-grain flex items-center justify-center px-6">
      <div className="orange-bleed" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="border border-border bg-bg-secondary p-10 text-center">
          {/* Brand */}
          <div className="flex items-baseline justify-center gap-0.5 mb-2">
            <span className="text-3xl font-display font-bold text-text-primary tracking-tight">ero</span>
            <span className="text-3xl font-display font-bold text-accent">.</span>
          </div>
          <p className="text-[9px] font-mono text-text-tertiary uppercase tracking-[0.2em] mb-10">
            x402 agent gateway
          </p>

          {/* Prompt */}
          <p className="text-sm font-mono text-text-secondary mb-2">
            Connect your wallet to continue
          </p>
          <p className="text-[10px] font-mono text-text-tertiary mb-8">
            Requires a Stellar-compatible wallet (Freighter)
          </p>

          {/* Connect button */}
          <Button
            onClick={wallet.connect}
            loading={wallet.connecting}
            className="w-full mb-6"
          >
            Connect Wallet
          </Button>

          {/* Back link */}
          <Link
            to="/"
            className="text-[10px] font-mono text-text-tertiary hover:text-accent transition-colors duration-[80ms] uppercase tracking-[0.15em]"
          >
            &larr; Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
