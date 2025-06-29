
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import GameHeader from '@/components/GameHeader';
import GameArea from '@/components/GameArea';
import Navigation from '@/components/Navigation';
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

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Round ended, reset
          toast.success('Round ended! New round starting...');
          setPrizePool(0);
          localStorage.removeItem('recentGames');
          return 86400; // Reset to 24 hours
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

  const savePlayerStats = (stats: PlayerData) => {
    if (!publicKey) return;
    localStorage.setItem(`playerStats_${publicKey}`, JSON.stringify(stats));
    setPlayerStats(stats);
  };

  const saveGameToRecent = (gameEntry: GameEntry) => {
    const existingGames = JSON.parse(localStorage.getItem('recentGames') || '[]');
    const updatedGames = [gameEntry, ...existingGames.slice(0, 9)];
    localStorage.setItem('recentGames', JSON.stringify(updatedGames));
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
      toast.success('Payment of 0.05 GOR processed! Game starting...');
      
      setPrizePool(prev => prev + 0.05);
      setIsPlaying(true);
      setCurrentScore(null);
      
      // Update player stats
      const updatedStats = {
        ...playerStats,
        gamesPlayed: playerStats.gamesPlayed + 1
      };
      savePlayerStats(updatedStats);

      // Update balance
      setGorBalance(prev => prev - 0.05);
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
      player: publicKey!,
      score,
      timestamp: new Date(),
      prize: 0
    };

    // Check for instant jackpot or round end
    if (score === 100) {
      gameEntry.prize = prizePool;
      toast.success(`INSTANT JACKPOT! You won ${prizePool.toFixed(2)} GOR!`);
      
      // Update player stats
      const updatedStats = {
        ...playerStats,
        totalWinnings: playerStats.totalWinnings + prizePool,
        bestScore: Math.max(playerStats.bestScore, score),
        winRate: ((playerStats.gamesPlayed * playerStats.winRate / 100) + 1) / (playerStats.gamesPlayed) * 100
      };
      savePlayerStats(updatedStats);
      
      // Reset round
      setPrizePool(0);
      setTimeRemaining(86400);
      localStorage.removeItem('recentGames');
    } else {
      // Update best score if needed
      const updatedStats = {
        ...playerStats,
        bestScore: Math.max(playerStats.bestScore, score)
      };
      savePlayerStats(updatedStats);
      
      toast.success(`Score: ${score}! ${score >= 90 ? 'Excellent!' : score >= 70 ? 'Great!' : 'Keep trying!'}`);
    }

    // Add to recent games
    saveGameToRecent(gameEntry);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent neon-text mb-2">
            GORBAGANA GRAB
          </h1>
          <p className="text-muted-foreground text-sm sm:text-lg px-2">
            Time your tap. Win the pot. Gorbagana testnet precision gaming.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mt-4">
            {isConnected && (
              <p className="text-xs sm:text-sm text-accent">
                Balance: {gorBalance.toFixed(4)} GOR
              </p>
            )}
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
          <div className="text-center mb-6 p-4 bg-card/50 border border-border rounded-lg mx-2 sm:mx-0">
            <p className="text-muted-foreground mb-2 text-sm sm:text-base">
              Connect your Backpack wallet to start playing
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Make sure you're connected to the Gorbagana testnet (RPC: https://rpc.gorbagana.wtf/)
            </p>
          </div>
        )}

        {/* Game Area */}
        <div className="px-2 sm:px-0">
          <GameArea
            isPlaying={isPlaying}
            onStop={handleGameStop}
            onStartGame={handleStartGame}
            canPlay={isConnected && gorBalance >= 0.05}
          />
        </div>

        {/* Insufficient balance warning */}
        {isConnected && gorBalance < 0.05 && (
          <div className="text-center mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg mx-2 sm:mx-0">
            <p className="text-destructive text-sm sm:text-base">
              Insufficient GOR balance. You need at least 0.05 GOR to play.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Current balance: {gorBalance.toFixed(4)} GOR
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 sm:mt-12 text-center text-muted-foreground px-2 sm:px-0">
          <p className="text-xs sm:text-sm">
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
