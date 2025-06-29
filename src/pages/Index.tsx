import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import GameHeader from '@/components/GameHeader';
import GameArea from '@/components/GameArea';
import PlayerStats from '@/components/PlayerStats';
import Leaderboard from '@/components/Leaderboard';
import RecentGames from '@/components/RecentGames';
import { useBackpackWallet } from '@/hooks/useBackpackWallet';
import { gorConnection } from '@/utils/gorConnection';
import { PublicKey } from '@solana/web3.js';

// Mock data types
interface PlayerData {
  walletAddress: string;
  totalWinnings: number;
  gamesPlayed: number;
  bestScore: number;
  winRate: number;
}

interface GameEntry {
  id: string;
  player: string;
  score: number;
  timestamp: Date;
  prize: number;
}

interface LeaderboardEntry {
  rank: number;
  address: string;
  totalWinnings: number;
  gamesWon: number;
}

const Index = () => {
  // Wallet integration
  const { isConnected, publicKey, isLoading, connect: connectWallet, disconnect } = useBackpackWallet();
  const [solBalance, setSolBalance] = useState<number>(0);

  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [prizePool, setPrizePool] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(86400); // 24 hours in seconds
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>();
  const [currentScore, setCurrentScore] = useState<number | null>(null);

  // Player data
  const [playerStats, setPlayerStats] = useState<PlayerData>({
    walletAddress: '',
    totalWinnings: 0,
    gamesPlayed: 0,
    bestScore: 0,
    winRate: 0
  });

  // Mock leaderboard data
  const [leaderboard] = useState<LeaderboardEntry[]>([
    { rank: 1, address: '8K7qX2vN9mB3pL4wR5tY6uI7oP8aS9dF', totalWinnings: 23.45, gamesWon: 12 },
    { rank: 2, address: '9M4tE6rY8uI3oP2aS7dF5gH1jK9lZ3xC', totalWinnings: 18.92, gamesWon: 8 },
    { rank: 3, address: '7B2nV5mK9lP4wR8tY3uI6oS1aD4fG7hJ', totalWinnings: 15.67, gamesWon: 6 },
    { rank: 4, address: '6C8vB4nM2kL9pW5rT7yU1iO3sA6dF9gH', totalWinnings: 12.34, gamesWon: 4 },
    { rank: 5, address: '5F3gH7jK1lZ9xC2vB8nM4kP6wR5tY9uI', totalWinnings: 9.81, gamesWon: 3 }
  ]);

  // Recent games data
  const [recentGames, setRecentGames] = useState<GameEntry[]>([]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Round ended, reset
          toast.success('Round ended! New round starting...');
          setPrizePool(0);
          setRecentGames([]);
          return 86400; // Reset to 24 hours
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check SOL balance when wallet connects
  useEffect(() => {
    if (isConnected && publicKey) {
      checkSolBalance();
    }
  }, [isConnected, publicKey]);

  const checkSolBalance = async () => {
    if (!publicKey) return;
    
    try {
      const pubKey = new PublicKey(publicKey);
      const balance = await gorConnection.getBalance(pubKey);
      setSolBalance(balance);
    } catch (error) {
      console.error('Failed to check SOL balance:', error);
    }
  };

  const handleConnectWallet = async () => {
    await connectWallet();
  };

  const handleStartGame = async () => {
    if (!isConnected || !publicKey) {
      toast.error('Please connect your Backpack wallet first');
      return;
    }

    if (solBalance < 0.05) {
      toast.error('Insufficient SOL balance. You need at least 0.05 SOL to play.');
      return;
    }

    try {
      // Create payment transaction
      const fromPubkey = new PublicKey(publicKey);
      // For demo purposes, using the same address as recipient (in production, this would be the game's treasury)
      const toPubkey = fromPubkey; 
      
      const transaction = await gorConnection.createGamePaymentTransaction(
        fromPubkey,
        toPubkey,
        0.05
      );

      // Note: In a real implementation, you would sign and send the transaction here
      // For now, we'll simulate the payment
      toast.success('Payment of 0.05 SOL processed! Game starting...');
      
      setPrizePool(prev => prev + 0.05);
      setIsPlaying(true);
      setCurrentScore(null);
      
      // Update player stats
      setPlayerStats(prev => ({
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1
      }));

      // Update balance
      setSolBalance(prev => prev - 0.05);
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment failed. Please try again.');
    }
  };

  const handleGameStop = (score: number) => {
    setIsPlaying(false);
    setCurrentScore(score);
    
    // Create game entry
    const gameEntry: GameEntry = {
      id: Date.now().toString(),
      player: walletAddress!,
      score,
      timestamp: new Date(),
      prize: 0
    };

    // Check for instant jackpot or round end
    if (score === 100) {
      gameEntry.prize = prizePool;
      toast.success(`INSTANT JACKPOT! You won ${prizePool.toFixed(2)} SOL!`);
      
      // Update player stats
      setPlayerStats(prev => ({
        ...prev,
        totalWinnings: prev.totalWinnings + prizePool,
        bestScore: Math.max(prev.bestScore, score),
        winRate: ((prev.gamesPlayed * prev.winRate / 100) + 1) / (prev.gamesPlayed) * 100
      }));
      
      // Reset round
      setPrizePool(0);
      setTimeRemaining(86400);
      setRecentGames([]);
    } else {
      // Update best score if needed
      setPlayerStats(prev => ({
        ...prev,
        bestScore: Math.max(prev.bestScore, score)
      }));
      
      toast.success(`Score: ${score}! ${score >= 90 ? 'Excellent!' : score >= 70 ? 'Great!' : 'Keep trying!'}`);
    }

    // Add to recent games
    setRecentGames(prev => [gameEntry, ...prev.slice(0, 9)]);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent neon-text mb-2">
            JACKPOT SWEEP
          </h1>
          <p className="text-muted-foreground text-lg">
            Time your tap. Win the pot. Gorbagana testnet precision gaming.
          </p>
          {isConnected && (
            <p className="text-sm text-accent mt-2">
              Balance: {solBalance.toFixed(4)} SOL
            </p>
          )}
        </div>

        {/* Game Header */}
        <GameHeader
          prizePool={prizePool}
          timeRemaining={timeRemaining}
          isWalletConnected={isConnected}
          walletAddress={publicKey}
          onConnectWallet={handleConnectWallet}
        />

        {/* Wallet Connection Status */}
        {!isConnected && (
          <div className="text-center mb-6 p-4 bg-card/50 border border-border rounded-lg">
            <p className="text-muted-foreground mb-2">
              Connect your Backpack wallet to start playing
            </p>
            <p className="text-sm text-muted-foreground">
              Make sure you're connected to the Gorbagana testnet (RPC: https://rpc.gorbagana.wtf/)
            </p>
          </div>
        )}

        {/* Game Area */}
        <GameArea
          isPlaying={isPlaying}
          onStop={handleGameStop}
          onStartGame={handleStartGame}
          canPlay={isConnected && solBalance >= 0.05}
        />

        {/* Insufficient balance warning */}
        {isConnected && solBalance < 0.05 && (
          <div className="text-center mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive">
              Insufficient SOL balance. You need at least 0.05 SOL to play.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Current balance: {solBalance.toFixed(4)} SOL
            </p>
          </div>
        )}

        {/* Stats and Leaderboards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player Stats */}
          <PlayerStats
            walletAddress={walletAddress}
            totalWinnings={playerStats.totalWinnings}
            gamesPlayed={playerStats.gamesPlayed}
            bestScore={playerStats.bestScore}
            winRate={playerStats.winRate}
          />

          {/* Leaderboard */}
          <Leaderboard players={leaderboard} />

          {/* Recent Games */}
          <RecentGames games={recentGames} />
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-muted-foreground">
          <p className="text-sm">
            Powered by Gorbagana Testnet • RPC: https://rpc.gorbagana.wtf/
          </p>
          <p className="text-xs mt-2">
            Game resets every 24 hours or on instant jackpot. Play responsibly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
