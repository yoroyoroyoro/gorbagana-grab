
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface BackpackWallet {
  isBackpack: boolean;
  publicKey: {
    toString(): string;
  };
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  signTransaction(transaction: any): Promise<any>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
}

declare global {
  interface Window {
    backpack?: BackpackWallet;
  }
}

export const useBackpackWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkConnection = useCallback(async () => {
    if (window.backpack?.publicKey) {
      setIsConnected(true);
      setPublicKey(window.backpack.publicKey.toString());
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connect = async () => {
    if (!window.backpack) {
      toast.error('Backpack wallet not found. Please install the Backpack extension.');
      window.open('https://backpack.app/', '_blank');
      return;
    }

    setIsLoading(true);
    try {
      await window.backpack.connect();
      const pubKey = window.backpack.publicKey?.toString();
      
      if (pubKey) {
        setIsConnected(true);
        setPublicKey(pubKey);
        toast.success('Wallet connected successfully!');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet. Make sure you\'re on the GOR testnet.');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    if (window.backpack) {
      try {
        await window.backpack.disconnect();
        setIsConnected(false);
        setPublicKey(null);
        toast.success('Wallet disconnected');
      } catch (error) {
        console.error('Failed to disconnect wallet:', error);
      }
    }
  };

  const signTransaction = async (transaction: any) => {
    if (!window.backpack || !isConnected) {
      throw new Error('Wallet not connected');
    }
    return await window.backpack.signTransaction(transaction);
  };

  return {
    isConnected,
    publicKey,
    isLoading,
    connect,
    disconnect,
    signTransaction,
    isInstalled: !!window.backpack,
  };
};
