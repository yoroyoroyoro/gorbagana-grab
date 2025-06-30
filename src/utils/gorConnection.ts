
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Gorbagana testnet RPC endpoint (HTTPS)
const GORBAGANA_RPC_URL = 'https://rpc.gorbagana.wtf/';

// Game treasury wallet (replace with actual treasury wallet address)
const GAME_TREASURY_WALLET = new PublicKey('FNd3TjAxv9FTK3YCQVMrWtP9LWFoaUwWLq7KsfGBn6vT');

export class GorConnection {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(GORBAGANA_RPC_URL, 'confirmed');
  }

  async getBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL; // Convert from lamports to SOL
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  async sendTransaction(transaction: Transaction, publicKey: PublicKey): Promise<string> {
    try {
      // Add recent blockhash
      const { blockhash } = await this.connection.getRecentBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send transaction
      const signature = await this.connection.sendRawTransaction(transaction.serialize());
      await this.connection.confirmTransaction(signature);
      
      return signature;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }

  async createGamePaymentTransaction(fromPubkey: PublicKey, amount: number): Promise<Transaction> {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey: GAME_TREASURY_WALLET, // Send to game treasury instead of self
        lamports: amount * LAMPORTS_PER_SOL, // Convert SOL to lamports
      })
    );

    return transaction;
  }

  async createPrizeDistributionTransaction(toPubkey: PublicKey, amount: number): Promise<Transaction> {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: GAME_TREASURY_WALLET, // Send from game treasury
        toPubkey,
        lamports: amount * LAMPORTS_PER_SOL, // Convert GOR to lamports
      })
    );

    return transaction;
  }

  getConnection(): Connection {
    return this.connection;
  }

  getTreasuryWallet(): PublicKey {
    return GAME_TREASURY_WALLET;
  }
}

export const gorConnection = new GorConnection();
