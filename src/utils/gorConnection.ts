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
      return balance / LAMPORTS_PER_SOL; // Convert from lamports to SOL equivalent
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  async sendTransaction(transaction: Transaction, publicKey: PublicKey): Promise<string> {
    try {
      // Send transaction directly - wallet will handle signing
      const signature = await this.connection.sendRawTransaction(transaction.serialize());
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      return signature;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }

  async createGamePaymentTransaction(fromPubkey: PublicKey, amount: number): Promise<Transaction> {
    try {
      // Verify the sender has sufficient balance
      const balance = await this.getBalance(fromPubkey);
      if (balance < amount) {
        throw new Error(`Insufficient balance. Required: ${amount} SOL, Available: ${balance.toFixed(4)} SOL`);
      }

      // Create the transaction - this will show as SOL in the wallet
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey: GAME_TREASURY_WALLET,
          lamports: Math.floor(amount * LAMPORTS_PER_SOL), // Convert SOL amount to lamports
        })
      );

      // Get recent blockhash and set fee payer
      const { blockhash } = await this.connection.getRecentBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      return transaction;
    } catch (error) {
      console.error('Failed to create game payment transaction:', error);
      throw error;
    }
  }

  async createPrizeDistributionTransaction(toPubkey: PublicKey, amount: number): Promise<Transaction> {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: GAME_TREASURY_WALLET,
        toPubkey,
        lamports: Math.floor(amount * LAMPORTS_PER_SOL), // Ensure integer lamports
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
