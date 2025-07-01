
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
      toast.error('Failed to connect wallet. Make sure you\'re on the Gorbagana testnet (https://rpc.gorbagana.wtf/).');
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
        toast.error('Failed to disconnect wallet');
      }
    }
  };

  const signTransaction = async (transaction: any) => {
    if (!window.backpack || !isConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      console.log('Requesting transaction signature from Backpack...');
      const signedTransaction = await window.backpack.signTransaction(transaction);
      console.log('Transaction signed successfully');
      return signedTransaction;
    } catch (error: any) {
      console.error('Transaction signing error:', error);
      
      // Handle specific Backpack errors more gracefully
      if (error.message?.includes('AccountNotFound') || error.code === 4001) {
        // This is the common "AccountNotFound" error that still allows transactions to proceed
        console.log('AccountNotFound error detected - this is usually safe to ignore on Gorbagana testnet');
        throw new Error('Transaction confirmation may show warnings, but should still process successfully. Please approve to continue.');
      } else if (error.message?.includes('User rejected')) {
        throw new Error('Transaction cancelled by user');
      } else {
        throw error;
      }
    }
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
