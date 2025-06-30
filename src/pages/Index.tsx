import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import GameHeader from '@/components/GameHeader';
import GameArea from '@/components/GameArea';
import SessionLeaderboard from '@/components/SessionLeaderboard';
import { useBackpackWallet } from '@/hooks/useBackpackWallet';
import { gorConnection } from '@/utils/gorConnection';
import { JackpotSystem } from '@/utils/jackpotSystem';
import { PublicKey } from '@solana/web3.js';
import { User, Trophy, Clock, Wallet, LogOut } from 'lucide-react';
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

interface SessionLeaderEntry {
  player: string;
  bestScore: number;
  timestamp: Date;
}

const Index = () => {
  // Wallet integration
  const { isConnected, publicKey, isLoading, connect: connectWallet, disconnect } = useBackpackWallet();
  const [gorBalance, setGorBalance] = useState<number>(0);
  const [balanceLoaded, setBalanceLoaded] = useState(false);

  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [prizePool, setPrizePool] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(86400); // 24 hours in seconds
  const [currentScore, setCurrentScore] = useState<number | null>(null);

  // Session leaderboard
  const [sessionLeaderboard, setSessionLeaderboard] = useState<SessionLeaderEntry[]>([]);

  // Player data
  const [playerStats, setPlayerStats] = useState<PlayerData>({
    walletAddress: '',
    totalWinnings: 0,
    gamesPlayed: 0,
    bestScore: 0,
    winRate: 0
  });

  // Modal state
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Initialize or get current round
  useEffect(() => {
    let round = JackpotSystem.getCurrentRound();
    if (!round) {
      round = JackpotSystem.initializeRound(0);
    }
    setPrizePool(round.prizePool);
    setTimeRemaining(JackpotSystem.getTimeRemaining(round));
    
    // Load session leaderboard for current round
    loadSessionLeaderboard(round.roundId);
  }, []);

  // Timer countdown and round management
  useEffect(() => {
    const timer = setInterval(() => {
      const round = JackpotSystem.getCurrentRound();
      if (!round) return;

      const remaining = JackpotSystem.getTimeRemaining(round);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        // Check and end expired round
        const result = JackpotSystem.checkAndEndExpiredRound();
        if (result.roundEnded) {
          if (result.winner) {
            toast.success(
              `Round ended! ${result.winner.player.slice(0, 6)}...${result.winner.player.slice(-4)} won ${result.winner.prize.toFixed(2)} GOR with score ${result.winner.score}!`
            );
          } else {
            toast.success('Round ended! No games were played.');
          }
          
          // Initialize new round and reset everything
          const newRound = JackpotSystem.initializeRound(0);
          setPrizePool(newRound.prizePool);
          setTimeRemaining(JackpotSystem.getTimeRemaining(newRound));
          // Clear session leaderboard immediately and from localStorage
          setSessionLeaderboard([]);
          localStorage.removeItem(`sessionLeaderboard_${round.roundId}`);
        }
      }
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

  const loadSessionLeaderboard = (roundId: string) => {
    const storedLeaderboard = localStorage.getItem(`sessionLeaderboard_${roundId}`);
    if (storedLeaderboard) {
      const leaderboard = JSON.parse(storedLeaderboard).map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }));
      setSessionLeaderboard(leaderboard);
    } else {
      setSessionLeaderboard([]);
    }
  };

  const updateSessionLeaderboard = (player: string, score: number) => {
    const round = JackpotSystem.getCurrentRound();
    if (!round) return;

    setSessionLeaderboard(prev => {
      const existingEntryIndex = prev.findIndex(entry => entry.player === player);
      let newLeaderboard;

      if (existingEntryIndex >= 0) {
        // Update existing entry if new score is better
        if (score > prev[existingEntryIndex].bestScore) {
          newLeaderboard = [...prev];
          newLeaderboard[existingEntryIndex] = {
            player,
            bestScore: score,
            timestamp: new Date()
          };
        } else {
          newLeaderboard = prev;
        }
      } else {
        // Add new entry
        newLeaderboard = [...prev, {
          player,
          bestScore: score,
          timestamp: new Date()
        }];
      }

      // Sort by best score (highest first), then by timestamp (earliest first for ties)
      const sortedLeaderboard = newLeaderboard.sort((a, b) => {
        if (a.bestScore !== b.bestScore) {
          return b.bestScore - a.bestScore;
        }
        return a.timestamp.getTime() - b.timestamp.getTime();
      });

      // Save to localStorage
      localStorage.setItem(`sessionLeaderboard_${round.roundId}`, JSON.stringify(sortedLeaderboard));
      
      return sortedLeaderboard;
    });
  };

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

    // Get current round and its ID before adding the game
    const currentRound = JackpotSystem.getCurrentRound();
    const currentRoundId = currentRound?.roundId;

    // Update session leaderboard first
    updateSessionLeaderboard(publicKey!, score);

    // Add game to jackpot system
    const updatedRound = JackpotSystem.addGameToRound(gameEntry, 0.05);
    setPrizePool(updatedRound.prizePool);

    // Check if this game won something
    const winnerGame = updatedRound.games.find(g => g.id === gameEntry.id);
    if (winnerGame && winnerGame.prize > 0) {
      toast.success(`INSTANT JACKPOT! You won ${winnerGame.prize.toFixed(2)} GOR!`);
      
      const updatedStats = {
        ...playerStats,
        totalWinnings: playerStats.totalWinnings + winnerGame.prize,
        bestScore: Math.max(playerStats.bestScore, score),
        winRate: ((playerStats.gamesPlayed * playerStats.winRate / 100) + 1) / (playerStats.gamesPlayed) * 100
      };
      savePlayerStats(updatedStats);
      
      // JACKPOT RESET: Clear session leaderboard completely
      setSessionLeaderboard([]);
      if (currentRoundId) {
        localStorage.removeItem(`sessionLeaderboard_${currentRoundId}`);
      }
      
      // Reset time for new round
      setTimeRemaining(86400);
    } else {
      const updatedStats = {
        ...playerStats,
        bestScore: Math.max(playerStats.bestScore, score)
      };
      savePlayerStats(updatedStats);
      
      toast.success(`Score: ${score}! ${score >= 90 ? 'Excellent!' : score >= 70 ? 'Great!' : 'Keep trying!'}`);
    }
  };

  const formatTime = () => {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDisconnectWallet = async () => {
    await disconnect();
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
          {!isConnected ? (
            <Button 
              onClick={handleConnectWallet}
              variant="outline" 
              className="pixel-pill text-teal-400 border-teal-400/40 hover:bg-teal-400/10"
            >
              <Wallet className="w-4 h-4 mr-2" />
              CONNECT
            </Button>
          ) : (
            <Button 
              onClick={handleDisconnectWallet}
              variant="outline" 
              className="pixel-pill text-red-400 border-red-400/40 hover:bg-red-400/10"
            >
              <Wallet className="w-4 h-4 mr-2" />
              {publicKey!.slice(0, 4)}...{publicKey!.slice(-4)}
              <LogOut className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Session Leaderboard - Vertical Rectangle under Navigation */}
      <div className="absolute top-20 right-6 z-20">
        <SessionLeaderboard players={sessionLeaderboard} />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex justify-center items-center gap-6 mb-2">
            <img 
              src="/lovable-uploads/afc917a3-89e5-4c59-bf83-19bbecee4d72.png" 
              alt="Gorbagana Grab" 
              className="w-auto h-96 pixel-art"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(32, 178, 170, 0.8)) drop-shadow(0 0 40px rgba(32, 178, 170, 0.4)) drop-shadow(0 0 60px rgba(32, 178, 170, 0.2))',
              }}
            />
          </div>

          {/* Game Stats - Moved closer to header */}
          <div className="flex justify-center gap-12 mb-6">
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
        </div>

        {/* Game Area */}
        <div className="mb-4">
          <GameArea
            isPlaying={isPlaying}
            onStop={handleGameStop}
            onStartGame={handleStartGame}
            canPlay={isConnected && balanceLoaded && gorBalance >= 0.05}
          />
        </div>

        {/* Balance Warning */}
        {isConnected && balanceLoaded && gorBalance < 0.05 && (
          <div className="text-center mt-8">
            <div className="clean-card border-red-400/50 bg-red-900/30">
              <p className="text-red-300 pixel-font">
                NEED 0.05 GOR TO PLAY
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Help Icon - Bottom Right */}
      <div className="fixed bottom-8 right-8 z-30">
        <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
          <DialogTrigger asChild>
            <div className="relative cursor-pointer group">
              {/* Help Icon - Removed the dot indicator */}
              <div className="w-32 h-32 hover:scale-110 transition-transform duration-200 cursor-pointer">
                <img 
                  src="/lovable-uploads/c69d84c3-2b69-430f-948c-8780de3594a6.png" 
                  alt="Help Character" 
                  className="w-full h-full pixel-art hover:brightness-125 transition-all duration-200"
                  style={{
                    filter: 'drop-shadow(0 0 20px rgba(32, 178, 170, 0.8)) drop-shadow(0 0 40px rgba(32, 178, 170, 0.4)) drop-shadow(0 0 60px rgba(32, 178, 170, 0.2))',
                  }}
                />
              </div>
            </div>
          </DialogTrigger>
          
          <DialogContent className="max-w-lg bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-800/95 border-teal-400/40 text-slate-100 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="pixel-font text-2xl text-teal-300 text-center mb-4">
                ROUND SYSTEM GUIDE
              </DialogTitle>
            </DialogHeader>
            
            <div className="pixel-font text-sm space-y-6 mt-6">
              <div className="p-4 bg-teal-900/30 rounded-lg border border-teal-400/30">
                <h3 className="text-teal-300 font-bold mb-2">Perfect Hit Jackpot</h3>
                <p className="text-slate-300">Score exactly 100 points to instantly win the entire prize pool!</p>
              </div>
              
              <div className="p-4 bg-emerald-900/30 rounded-lg border border-emerald-400/30">
                <h3 className="text-emerald-300 font-bold mb-2">24-Hour Rounds</h3>
                <p className="text-slate-300">Each round lasts exactly 24 hours. Make every game count!</p>
              </div>
              
              <div className="p-4 bg-cyan-900/30 rounded-lg border border-cyan-400/30">
                <h3 className="text-cyan-300 font-bold mb-2">Highest Score Wins</h3>
                <p className="text-slate-300">If no jackpot is hit, the player with the highest score wins the prize pool.</p>
              </div>
              
              <div className="p-4 bg-yellow-900/30 rounded-lg border border-yellow-400/30">
                <h3 className="text-yellow-300 font-bold mb-2">Tiebreaker Rule</h3>
                <p className="text-slate-300">When scores are tied, the first player to achieve that score wins!</p>
              </div>
              
              <div className="p-4 bg-pink-900/30 rounded-lg border border-pink-400/30">
                <h3 className="text-pink-300 font-bold mb-2">Entry Fee</h3>
                <p className="text-slate-300">Each game costs 0.05 GOR, which adds directly to the growing prize pool.</p>
              </div>
              
              <div className="mt-8 pt-6 border-t border-teal-400/30 text-center">
                <div className="text-teal-300 pixel-font text-lg font-bold">
                  Pay → Play → Win Big!
                </div>
                <div className="text-slate-400 pixel-font text-xs mt-2">
                  Time your tap perfectly to hit the trash can
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
