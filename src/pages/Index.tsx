
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GameHeader from '@/components/GameHeader';
import GameArea from '@/components/GameArea';
import Navigation from '@/components/Navigation';
import PlayerStats from '@/components/PlayerStats';
import Leaderboard from '@/components/Leaderboard';
import RecentGames from '@/components/RecentGames';
import { useBackpackWallet } from '@/hooks/useBackpackWallet';
import { gorConnection } from '@/utils/gorConnection';
import { PublicKey } from '@solana/web3.js';
import { User, Trophy, Clock } from 'lucide-react';

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
  const { isConnected, publicKey, isLoading, connect: connectWallet } = useBackpackWallet();
  const [gorBalance, setGorBalance] = useState<number>(0);

  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [prizePool, setPrizePool] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(86400); // 24 hours in seconds
  const [currentScore, setCurrentScore] = useState<number | null>(null);

  // Player data
  const [playerStats, setPlayerStats] = useState<PlayerData>({
    walletAddress: '',
    totalWinnings: 0,
    gamesPlayed: 0,
    bestScore: 0,
    winRate: 0
  });

  // Mock data for tabs
  const [recentGames, setRecentGames] = useState<GameEntry[]>([]);
  const [leaderboard] = useState<LeaderboardEntry[]>([
    { rank: 1, address: '8K7qX2vN9mB3pL4wR5tY6uI7oP8aS9dF', totalWinnings: 23.45, gamesWon: 12 },
    { rank: 2, address: '9M4tE6rY8uI3oP2aS7dF5gH1jK9lZ3xC', totalWinnings: 18.92, gamesWon: 8 },
    { rank: 3, address: '7B2nV5mK9lP4wR8tY3uI6oS1aD4fG7hJ', totalWinnings: 15.67, gamesWon: 6 },
    { rank: 4, address: '6C8vB4nM2kL9pW5rT7yU1iO3sA6dF9gH', totalWinnings: 12.34, gamesWon: 4 },
    { rank: 5, address: '5F3gH7jK1lZ9xC2vB8nM4kP6wR5tY9uI', totalWinnings: 9.81, gamesWon: 3 }
  ]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          toast.success('Round ended! New round starting...');
          setPrizePool(0);
          localStorage.removeItem('recentGames');
          return 86400;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check GOR balance when wallet connects
  useEffect(() => {
    if (isConnected && publicKey) {
      checkGorBalance();
      loadPlayerStats();
      loadRecentGames();
    }
  }, [isConnected, publicKey]);

  const checkGorBalance = async () => {
    if (!publicKey) return;
    
    try {
      const pubKey = new PublicKey(publicKey);
      const balance = await gorConnection.getBalance(pubKey);
      setGorBalance(balance);
    } catch (error) {
      console.error('Failed to check GOR balance:', error);
    }
  };

  const loadPlayerStats = () => {
    if (!publicKey) return;
    
    const savedStats = localStorage.getItem(`playerStats_${publicKey}`);
    if (savedStats) {
      setPlayerStats(JSON.parse(savedStats));
    } else {
      setPlayerStats({
        walletAddress: publicKey,
        totalWinnings: 0,
        gamesPlayed: 0,
        bestScore: 0,
        winRate: 0
      });
    }
  };

  const loadRecentGames = () => {
    const savedGames = localStorage.getItem('recentGames');
    if (savedGames) {
      const games = JSON.parse(savedGames);
      const gamesWithDates = games.map((game: any) => ({
        ...game,
        timestamp: new Date(game.timestamp)
      }));
      setRecentGames(gamesWithDates);
    }
  };

  const savePlayerStats = (stats: PlayerData) => {
    if (!publicKey) return;
    localStorage.setItem(`playerStats_${publicKey}`, JSON.stringify(stats));
    setPlayerStats(stats);
  };

  const saveGameToRecent = (gameEntry: GameEntry) => {
    const existingGames = JSON.parse(localStorage.getItem('recentGames') || '[]');
    const updatedGames = [gameEntry, ...existingGames.slice(0, 9)];
    localStorage.setItem('recentGames', JSON.stringify(updatedGames));
    setRecentGames(updatedGames);
  };

  const handleConnectWallet = async () => {
    await connectWallet();
  };

  const handleStartGame = async () => {
    if (!isConnected || !publicKey) {
      toast.error('Please connect your Backpack wallet first');
      return;
    }

    if (gorBalance < 0.05) {
      toast.error('Insufficient GOR balance. You need at least 0.05 GOR to play.');
      return;
    }

    try {
      const fromPubkey = new PublicKey(publicKey);
      const toPubkey = fromPubkey; 
      
      const transaction = await gorConnection.createGamePaymentTransaction(
        fromPubkey,
        toPubkey,
        0.05
      );

      toast.success('Payment of 0.05 GOR processed! Game starting...');
      
      setPrizePool(prev => prev + 0.05);
      setIsPlaying(true);
      setCurrentScore(null);
      
      const updatedStats = {
        ...playerStats,
        gamesPlayed: playerStats.gamesPlayed + 1
      };
      savePlayerStats(updatedStats);

      setGorBalance(prev => prev - 0.05);
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment failed. Please try again.');
    }
  };

  const handleGameStop = (score: number) => {
    setIsPlaying(false);
    setCurrentScore(score);
    
    const gameEntry: GameEntry = {
      id: Date.now().toString(),
      player: publicKey!,
      score,
      timestamp: new Date(),
      prize: 0
    };

    if (score === 100) {
      gameEntry.prize = prizePool;
      toast.success(`INSTANT JACKPOT! You won ${prizePool.toFixed(2)} GOR!`);
      
      const updatedStats = {
        ...playerStats,
        totalWinnings: playerStats.totalWinnings + prizePool,
        bestScore: Math.max(playerStats.bestScore, score),
        winRate: ((playerStats.gamesPlayed * playerStats.winRate / 100) + 1) / (playerStats.gamesPlayed) * 100
      };
      savePlayerStats(updatedStats);
      
      setPrizePool(0);
      setTimeRemaining(86400);
      localStorage.removeItem('recentGames');
    } else {
      const updatedStats = {
        ...playerStats,
        bestScore: Math.max(playerStats.bestScore, score)
      };
      savePlayerStats(updatedStats);
      
      toast.success(`Score: ${score}! ${score >= 90 ? 'Excellent!' : score >= 70 ? 'Great!' : 'Keep trying!'}`);
    }

    saveGameToRecent(gameEntry);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Pixelated Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: `url('/lovable-uploads/58d1aeda-ee90-40d9-9e97-2b52f4024eae.png')`,
          imageRendering: 'pixelated'
        }}
      />
      
      {/* Overlay for better readability */}
      <div className="fixed inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />
      
      <div className="relative z-10 container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* Top Bar with Header and Tabs */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
          {/* Header with Gorbagana Icon */}
          <div className="flex-1">
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
              <img 
                src="/lovable-uploads/b2c25c3c-fa02-453c-ac6c-b981edeccf43.png" 
                alt="Gorbagana" 
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 pixel-art"
              />
              <div className="text-center lg:text-left">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold pixel-font bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent neon-text mb-2">
                  GORBAGANA GRAB
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base pixel-font tracking-wider">
                  Time your tap. Win the pot. Gorbagana testnet precision gaming.
                </p>
                {isConnected && (
                  <p className="text-xs sm:text-sm text-accent pixel-font mt-2 tracking-wider">
                    Balance: {gorBalance.toFixed(4)} GOR
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="w-full lg:w-auto lg:min-w-[400px]">
            <Tabs defaultValue="stats" className="w-full">
              <TabsList className="grid w-full grid-cols-3 pixel-border bg-card/80 backdrop-blur-sm">
                <TabsTrigger value="stats" className="pixel-font text-xs">
                  <User className="w-3 h-3 mr-1 pixel-art" />
                  STATS
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="pixel-font text-xs">
                  <Trophy className="w-3 h-3 mr-1 pixel-art" />
                  LEADERS
                </TabsTrigger>
                <TabsTrigger value="recent" className="pixel-font text-xs">
                  <Clock className="w-3 h-3 mr-1 pixel-art" />
                  RECENT
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="stats" className="mt-4">
                <div className="pixel-border bg-card/80 backdrop-blur-sm p-4 max-h-80 overflow-y-auto">
                  <PlayerStats
                    walletAddress={publicKey}
                    totalWinnings={playerStats.totalWinnings}
                    gamesPlayed={playerStats.gamesPlayed}
                    bestScore={playerStats.bestScore}
                    winRate={playerStats.winRate}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="leaderboard" className="mt-4">
                <div className="pixel-border bg-card/80 backdrop-blur-sm p-4 max-h-80 overflow-y-auto">
                  <Leaderboard players={leaderboard} />
                </div>
              </TabsContent>
              
              <TabsContent value="recent" className="mt-4">
                <div className="pixel-border bg-card/80 backdrop-blur-sm p-4 max-h-80 overflow-y-auto">
                  <RecentGames games={recentGames} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Navigation */}
        <Navigation />

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
          <div className="text-center mb-6 p-6 bg-card/80 backdrop-blur-sm border border-border mx-2 sm:mx-0 pixel-border">
            <p className="text-muted-foreground mb-3 text-sm sm:text-base pixel-font tracking-wider">
              Connect your Backpack wallet to start playing
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground pixel-font tracking-wide">
              Make sure you're connected to the Gorbagana testnet (RPC: https://rpc.gorbagana.wtf/)
            </p>
          </div>
        )}

        {/* Game Area */}
        <div className="px-2 sm:px-0 mb-8">
          <GameArea
            isPlaying={isPlaying}
            onStop={handleGameStop}
            onStartGame={handleStartGame}
            canPlay={isConnected && gorBalance >= 0.05}
          />
        </div>

        {/* Insufficient balance warning */}
        {isConnected && gorBalance < 0.05 && (
          <div className="text-center mb-6 p-6 bg-destructive/20 backdrop-blur-sm border border-destructive/40 mx-2 sm:mx-0 pixel-border">
            <p className="text-destructive text-sm sm:text-base pixel-font tracking-wider">
              Insufficient GOR balance. You need at least 0.05 GOR to play.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 pixel-font tracking-wide">
              Current balance: {gorBalance.toFixed(4)} GOR
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-muted-foreground px-2 sm:px-0">
          <p className="text-xs sm:text-sm pixel-font tracking-wider">
            Powered by Gorbagana Testnet • RPC: https://rpc.gorbagana.wtf/
          </p>
          <p className="text-xs mt-2 pixel-font tracking-wide">
            Game resets every 24 hours or on instant jackpot. Play responsibly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
