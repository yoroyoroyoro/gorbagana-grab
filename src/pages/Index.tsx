
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import GameHeader from '@/components/GameHeader';
import GameArea from '@/components/GameArea';
import { useBackpackWallet } from '@/hooks/useBackpackWallet';
import { gorConnection } from '@/utils/gorConnection';
import { PublicKey } from '@solana/web3.js';
import { User, Trophy, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const [balanceLoaded, setBalanceLoaded] = useState(false);

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
    } else {
      setBalanceLoaded(false);
      setGorBalance(0);
    }
  }, [isConnected, publicKey]);

  const checkGorBalance = async () => {
    if (!publicKey) return;
    
    try {
      const pubKey = new PublicKey(publicKey);
      const balance = await gorConnection.getBalance(pubKey);
      setGorBalance(balance);
      setBalanceLoaded(true);
    } catch (error) {
      console.error('Failed to check GOR balance:', error);
      setBalanceLoaded(true);
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
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-15"
        style={{
          backgroundImage: `url('/lovable-uploads/58d1aeda-ee90-40d9-9e97-2b52f4024eae.png')`,
          imageRendering: 'pixelated'
        }}
      />
      
      {/* Pixel Dither Overlay */}
      <div className="fixed inset-0 pixel-dither opacity-40" />
      
      <div className="relative z-10 container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* Top Bar with Header and Navigation Tabs */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
          {/* Header with Gorbagana Icon */}
          <div className="flex-1">
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
              <div className="pixel-border pixel-bevel bg-card/90 p-4">
                <img 
                  src="/lovable-uploads/b2c25c3c-fa02-453c-ac6c-b981edeccf43.png" 
                  alt="Gorbagana" 
                  className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 pixel-art"
                />
              </div>
              <div className="text-center lg:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold pixel-font-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent neon-text mb-4">
                  GORBAGANA GRAB
                </h1>
                <p className="text-muted-foreground pixel-font tracking-ultra-wide mb-2">
                  TIME YOUR TAP. WIN THE POT.
                </p>
                <p className="text-muted-foreground pixel-font text-xs tracking-wider">
                  GORBAGANA TESTNET PRECISION GAMING
                </p>
                {isConnected && balanceLoaded && (
                  <p className="text-accent pixel-font mt-3 tracking-wider">
                    BALANCE: {gorBalance.toFixed(4)} GOR
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs - Top Right */}
          <div className="w-full lg:w-auto lg:min-w-[400px]">
            <div className="pixel-tabs">
              <div className="grid grid-cols-3 gap-3">
                <Button asChild variant="outline" size="sm" className="pixel-tab border-primary">
                  <Link to="/stats">
                    <User className="w-3 h-3 mr-2 pixel-art" />
                    <span className="pixel-font">STATS</span>
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="sm" className="pixel-tab border-accent">
                  <Link to="/leaderboard">
                    <Trophy className="w-3 h-3 mr-2 pixel-art" />
                    <span className="pixel-font">LEADERS</span>
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="sm" className="pixel-tab border-secondary">
                  <Link to="/recent">
                    <Clock className="w-3 h-3 mr-2 pixel-art" />
                    <span className="pixel-font">RECENT</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
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
          <div className="text-center mb-6 p-6 retro-card pixel-border pixel-bevel mx-2 sm:mx-0">
            <p className="text-muted-foreground mb-3 pixel-font tracking-wider">
              CONNECT YOUR BACKPACK WALLET TO START PLAYING
            </p>
            <p className="text-muted-foreground pixel-font text-xs tracking-wide">
              GORBAGANA TESTNET RPC: HTTPS://RPC.GORBAGANA.WTF/
            </p>
          </div>
        )}

        {/* Game Area */}
        <div className="px-2 sm:px-0 mb-8">
          <GameArea
            isPlaying={isPlaying}
            onStop={handleGameStop}
            onStartGame={handleStartGame}
            canPlay={isConnected && balanceLoaded && gorBalance >= 0.05}
          />
        </div>

        {/* Insufficient balance warning - only show if balance is loaded */}
        {isConnected && balanceLoaded && gorBalance < 0.05 && (
          <div className="text-center mb-6 p-6 retro-card pixel-border pixel-bevel mx-2 sm:mx-0 border-destructive">
            <p className="text-destructive pixel-font tracking-wider">
              INSUFFICIENT GOR BALANCE
            </p>
            <p className="text-destructive pixel-font text-xs mt-2">
              YOU NEED AT LEAST 0.05 GOR TO PLAY
            </p>
            <p className="text-muted-foreground pixel-font text-xs mt-3 tracking-wide">
              CURRENT BALANCE: {gorBalance.toFixed(4)} GOR
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-muted-foreground px-2 sm:px-0">
          <div className="pixel-border pixel-bevel retro-card p-4">
            <p className="pixel-font text-xs tracking-wider mb-2">
              POWERED BY GORBAGANA TESTNET
            </p>
            <p className="pixel-font text-xs tracking-wide">
              RPC: HTTPS://RPC.GORBAGANA.WTF/
            </p>
            <p className="pixel-font text-xs mt-3 tracking-wide">
              GAME RESETS EVERY 24 HOURS OR ON INSTANT JACKPOT
            </p>
            <p className="pixel-font text-xs mt-1 tracking-wide">
              PLAY RESPONSIBLY
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
