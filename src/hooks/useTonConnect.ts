import { useState, useEffect } from 'react';
import { getOrCreateUser, getUserStats, User, UserStats } from '@/lib/api';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        initDataUnsafe: {
          user?: {
            id: number;
            username?: string;
          };
          start_param?: string;
        };
      };
    };
  }
}

export function useTonConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    setLoading(true);
    try {
      const mockAddress = 'UQC' + Math.random().toString(36).substr(2, 42).toUpperCase();
      
      const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
      const referralCode = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
      
      const userData = await getOrCreateUser(mockAddress, telegramId, referralCode);
      
      setWalletAddress(mockAddress);
      setIsConnected(true);
      setUser(userData);
      
      await loadStats(mockAddress);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress('');
    setUser(null);
    setStats(null);
  };

  const loadStats = async (address?: string) => {
    const addr = address || walletAddress;
    if (!addr) return;

    try {
      const userStats = await getUserStats(addr);
      setStats(userStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const refreshData = async () => {
    if (walletAddress) {
      await loadStats(walletAddress);
    }
  };

  return {
    isConnected,
    walletAddress,
    user,
    stats,
    loading,
    connectWallet,
    disconnectWallet,
    refreshData,
  };
}
