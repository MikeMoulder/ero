import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as freighter from '../services/freighter';
import { api } from '../services/api';

const WALLET_STORAGE_KEY = 'ero_connected_wallet';

export interface AgentWalletInfo {
  agentPublicKey: string;
  balance: number;
  activated: boolean;
  xlmBalance: number;
  createdAt: string;
}

interface WalletState {
  connected: boolean;
  publicKey: string | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  agentWallet: AgentWalletInfo | null;
  agentWalletLoading: boolean;
  refreshAgentWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletState>({
  connected: false,
  publicKey: null,
  connecting: false,
  connect: async () => {},
  disconnect: () => {},
  agentWallet: null,
  agentWalletLoading: false,
  refreshAgentWallet: async () => {},
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [agentWallet, setAgentWallet] = useState<AgentWalletInfo | null>(null);
  const [agentWalletLoading, setAgentWalletLoading] = useState(false);

  const fetchAgentWallet = useCallback(async (userPubKey: string) => {
    setAgentWalletLoading(true);
    try {
      const wallet = await api.getAgentWallet(userPubKey);
      setAgentWallet({
        agentPublicKey: wallet.agentPublicKey,
        balance: wallet.balance,
        activated: wallet.activated,
        xlmBalance: wallet.xlmBalance,
        createdAt: wallet.createdAt,
      });
    } catch (err) {
      console.error('Failed to fetch agent wallet:', err);
    } finally {
      setAgentWalletLoading(false);
    }
  }, []);

  const refreshAgentWallet = useCallback(async () => {
    if (publicKey) {
      await fetchAgentWallet(publicKey);
    }
  }, [publicKey, fetchAgentWallet]);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const address = await freighter.connectWallet();
      setPublicKey(address);
      sessionStorage.setItem(WALLET_STORAGE_KEY, address);
      // Auto-create/fetch agent wallet on connect
      await fetchAgentWallet(address);
    } catch (err) {
      console.error('Wallet connection failed:', err);
      throw err;
    } finally {
      setConnecting(false);
    }
  }, [fetchAgentWallet]);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setAgentWallet(null);
    sessionStorage.removeItem(WALLET_STORAGE_KEY);
  }, []);

  // Restore wallet connection on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(WALLET_STORAGE_KEY);
    if (stored) {
      setPublicKey(stored);
      fetchAgentWallet(stored).catch(() => {
        // If restore fails, clear the stale key
        sessionStorage.removeItem(WALLET_STORAGE_KEY);
        setPublicKey(null);
      });
    }
  }, [fetchAgentWallet]);

  return (
    <WalletContext.Provider
      value={{
        connected: !!publicKey,
        publicKey,
        connecting,
        connect,
        disconnect,
        agentWallet,
        agentWalletLoading,
        refreshAgentWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
