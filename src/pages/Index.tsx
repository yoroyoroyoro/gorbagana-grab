
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

  const formatTime = () => {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Navigation Pills - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <div className="flex gap-3">
          <Button asChild variant="outline" className="pixel-pill">
            <Link to="/stats">
              <User className="w-4 h-4 mr-2" />
              STATS
            </Link>
          </Button>
          <Button asChild variant="outline" className="pixel-pill">
            <Link to="/leaderboard">
              <Trophy className="w-4 h-4 mr-2" />
              SCORES
            </Link>
          </Button>
          <Button asChild variant="outline" className="pixel-pill">
            <Link to="/recent">
              <Clock className="w-4 h-4 mr-2" />
              RECENT
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-6 mb-8">
            <img 
              src="/lovable-uploads/afc917a3-89e5-4c59-bf83-19bbecee4d72.png" 
              alt="Gorbagana Grab" 
              className="w-auto h-96 pixel-art"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(32, 178, 170, 0.8)) drop-shadow(0 0 40px rgba(32, 178, 170, 0.4)) drop-shadow(0 0 60px rgba(32, 178, 170, 0.2))',
              }}
            />
          </div>
        </div>

        {/* Game Stats */}
        <div className="flex justify-center gap-12 mb-16">
          <div className="clean-card text-center">
            <div className="text-2xl font-bold text-teal-300 pixel-font">{prizePool.toFixed(2)} GOR</div>
            <div className="text-sm text-teal-500 pixel-font">PRIZE POOL</div>
          </div>
          
          <div className="clean-card text-center">
            <div className="text-2xl font-bold text-emerald-300 pixel-font">{formatTime()}</div>
            <div className="text-sm text-emerald-500 pixel-font">TIME LEFT</div>
          </div>
          
          {isConnected && (
            <div className="clean-card text-center">
              <div className="text-2xl font-bold text-cyan-300 pixel-font">{gorBalance.toFixed(2)} GOR</div>
              <div className="text-sm text-cyan-500 pixel-font">BALANCE</div>
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className="mb-12">
          <GameArea
            isPlaying={isPlaying}
            onStop={handleGameStop}
            onStartGame={handleStartGame}
            canPlay={isConnected && balanceLoaded && gorBalance >= 0.05}
          />
        </div>

        {/* Wallet Connection */}
        {!isConnected && (
          <div className="text-center mt-12">
            <Button 
              onClick={handleConnectWallet}
              className="pixel-button-primary"
            >
              CONNECT WALLET TO PLAY
            </Button>
          </div>
        )}

        {/* Balance Warning */}
        {isConnected && balanceLoaded && gorBalance < 0.05 && (
          <div className="text-center mt-10">
            <div className="clean-card border-red-400/50 bg-red-900/30">
              <p className="text-red-300 pixel-font">
                NEED 0.05 GOR TO PLAY
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
