

import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Gorbagana testnet RPC endpoint (HTTPS)
const GORBAGANA_RPC_URL = 'https://rpc.gorbagana.wtf/';

// Game treasury wallet address
const GAME_TREASURY_WALLET = new PublicKey('HfgivaZsGLN9e7AE2TRkMXhdoRzCqjLwXHeFeTcgW5tY');

export class GorConnection {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(GORBAGANA_RPC_URL, 'confirmed');
  }

  async getBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  async sendTransaction(transaction: Transaction, publicKey: PublicKey): Promise<string> {
    try {
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
      console.log('Creating transaction with proper lamports conversion...');
      console.log('Amount in SOL:', amount);
      console.log('Amount in lamports:', Math.floor(amount * LAMPORTS_PER_SOL));
      
      // Verify the sender has sufficient balance
      const balance = await this.getBalance(fromPubkey);
      console.log('Current balance:', balance, 'SOL');
      
      if (balance < amount) {
        throw new Error(`Insufficient balance. Required: ${amount} SOL, Available: ${balance.toFixed(4)} SOL`);
      }

      // Create the transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey: GAME_TREASURY_WALLET,
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        })
      );

      // Get recent blockhash and set fee payer
      const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      console.log('Transaction created successfully');
      console.log('From:', fromPubkey.toString());
      console.log('To:', GAME_TREASURY_WALLET.toString());

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
        lamports: Math.floor(amount * LAMPORTS_PER_SOL),
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

