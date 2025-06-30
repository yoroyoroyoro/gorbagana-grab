
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import GameArea from '@/components/GameArea';
import SessionLeaderboard from '@/components/SessionLeaderboard';
import NavigationPills from '@/components/NavigationPills';
import GameStats from '@/components/GameStats';
import HelpModal from '@/components/HelpModal';
import { useBackpackWallet } from '@/hooks/useBackpackWallet';
import { useJackpotRound } from '@/hooks/useJackpotRound';
import { useSessionLeaderboard } from '@/hooks/useSessionLeaderboard';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { gorConnection } from '@/utils/gorConnection';
import { PublicKey } from '@solana/web3.js';

interface GameEntry {
  id: string;
  player: string;
  score: number;
  timestamp: Date;
  prize: number;
}

const Index = () => {
  // Wallet integration
  const { isConnected, publicKey, isLoading, connect: connectWallet, disconnect } = useBackpackWallet();
  const [gorBalance, setGorBalance] = useState<number>(0);
  const [balanceLoaded, setBalanceLoaded] = useState(false);

  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentScore, setCurrentScore] = useState<number | null>(null);

  // Custom hooks
  const { prizePool, timeRemaining, formatTime, addGameToRound, resetTimeForNewRound } = useJackpotRound();
  const { sessionLeaderboard, updateSessionLeaderboard, clearSessionLeaderboard } = useSessionLeaderboard();
  const { playerStats, updateStatsForGame, updateBestScore } = usePlayerStats(publicKey);

  // Modal state
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Check GOR balance when wallet connects
  useEffect(() => {
    if (isConnected && publicKey) {
      checkGorBalance();
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
      
      updateStatsForGame(0, 0); // Just increment games played
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

    // Update session leaderboard first (only if not a jackpot)
    if (score !== 100) {
      updateSessionLeaderboard(publicKey!, score);
    }

    // Add game to jackpot system
    const updatedRound = addGameToRound(gameEntry, 0.05);

    // Check if this game won something
    const winnerGame = updatedRound.games.find(g => g.id === gameEntry.id);
    if (winnerGame && winnerGame.prize > 0) {
      toast.success(`INSTANT JACKPOT! You won ${winnerGame.prize.toFixed(2)} GOR!`);
      
      updateStatsForGame(score, winnerGame.prize);
      
      // JACKPOT RESET: Clear session leaderboard completely
      clearSessionLeaderboard();
      
      // Reset time for new round
      resetTimeForNewRound();
    } else {
      updateBestScore(score);
      
      toast.success(`Score: ${score}! ${score >= 90 ? 'Excellent!' : score >= 70 ? 'Great!' : 'Keep trying!'}`);
    }
  };

  const handleDisconnectWallet = async () => {
    await disconnect();
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Navigation Pills */}
      <NavigationPills 
        isConnected={isConnected}
        publicKey={publicKey}
        onConnect={handleConnectWallet}
        onDisconnect={handleDisconnectWallet}
      />

      {/* Session Leaderboard */}
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

          {/* Game Stats */}
          <GameStats 
            prizePool={prizePool}
            timeRemaining={formatTime()}
            gorBalance={gorBalance}
            isConnected={isConnected}
          />
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

      {/* Help Modal */}
      <HelpModal 
        isOpen={isHelpModalOpen}
        onOpenChange={setIsHelpModalOpen}
      />
    </div>
  );
};

export default Index;
