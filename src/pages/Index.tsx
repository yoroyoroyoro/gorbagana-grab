import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
  const { isConnected, publicKey, isLoading, connect: connectWallet, disconnect, signTransaction } = useBackpackWallet();
  const [gorBalance, setGorBalance] = useState<number>(0);
  const [balanceLoaded, setBalanceLoaded] = useState(false);

  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Custom hooks
  const { prizePool, timeRemaining, formatTime, addGameToRound, resetTimeForNewRound } = useJackpotRound();
  const { sessionLeaderboard, updateSessionLeaderboard, clearSessionLeaderboard, forceRefreshLeaderboard } = useSessionLeaderboard();
  const { playerStats, updateStatsForGame, updateBestScore } = usePlayerStats(publicKey);

  // Modal state
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Transform sessionLeaderboard to match SessionPlayer interface
  const sessionPlayers = sessionLeaderboard.map(entry => ({
    publicKey: entry.player,
    bestScore: entry.bestScore,
    gamesPlayed: 1 // We don't track games played per session, so default to 1
  }));

  // Listen for round events to clear session leaderboard
  useEffect(() => {
    const handleRoundEnded = () => {
      console.log('Round ended - clearing session leaderboard');
      clearSessionLeaderboard();
      forceRefreshLeaderboard();
    };

    const handleJackpotWon = () => {
      console.log('Jackpot won - clearing session leaderboard');
      clearSessionLeaderboard();
      forceRefreshLeaderboard();
    };

    window.addEventListener('roundEnded', handleRoundEnded);
    window.addEventListener('jackpotWon', handleJackpotWon);

    return () => {
      window.removeEventListener('roundEnded', handleRoundEnded);
      window.removeEventListener('jackpotWon', handleJackpotWon);
    };
  }, [clearSessionLeaderboard, forceRefreshLeaderboard]);

  // Check GOR balance when wallet connects
  useEffect(() => {
    if (isConnected && publicKey) {
      checkGorBalance();
    } else {
      setBalanceLoaded(false);
      setGorBalance(0);
    }
  }, [isConnected, publicKey]);

  // Update balance every 10 seconds when wallet is connected
  useEffect(() => {
    if (!isConnected || !publicKey) return;

    const updateBalance = async () => {
      try {
        const pubKey = new PublicKey(publicKey);
        const balance = await gorConnection.getBalance(pubKey);
        setGorBalance(balance);
      } catch (error) {
        console.error('Failed to update balance:', error);
      }
    };

    const interval = setInterval(updateBalance, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
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

    if (gorBalance < 0.06) { // Increased buffer to account for fees
      toast.error('Insufficient balance. You need at least 0.06 SOL to play (including transaction fees).');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const fromPubkey = new PublicKey(publicKey);
      
      console.log('Creating payment transaction for 0.05 SOL...');
      console.log('From:', fromPubkey.toString());
      console.log('To:', gorConnection.getTreasuryWallet().toString());
      console.log('Current balance:', gorBalance.toFixed(4), 'SOL');
      
      // Create the payment transaction
      const transaction = await gorConnection.createGamePaymentTransaction(fromPubkey, 0.05);
      
      console.log('Transaction created, requesting signature...');
      
      // Sign the transaction using the wallet
      const signedTransaction = await signTransaction(transaction);
      
      console.log('Transaction signed, sending to network...');
      
      // Send the signed transaction (this just sends it to mempool)
      const signature = await gorConnection.sendTransactionQuick(signedTransaction);
      
      console.log('Payment transaction sent to mempool:', signature);
      
      // Start the game IMMEDIATELY after transaction is sent
      toast.success('Payment sent! Game starting...', {
        description: `Transaction: ${signature.slice(0, 8)}...${signature.slice(-8)}`
      });
      
      // Start the game immediately
      setIsPlaying(true);
      setCurrentScore(null);
      
      updateStatsForGame(0, 0); // Just increment games played
      
      // Update balance in background without blocking game start
      setTimeout(() => {
        checkGorBalance();
      }, 2000);
      
    } catch (error: any) {
      console.error('Payment failed:', error);
      
      // Handle specific error types more gracefully
      if (error.message?.includes('Insufficient balance')) {
        toast.error('Insufficient balance. Please add more SOL to your wallet.');
      } else if (error.message?.includes('User rejected') || error.message?.includes('cancelled')) {
        toast.error('Transaction cancelled by user.');
      } else {
        toast.error('Payment failed. Please check your balance and try again.', {
          description: error.message || 'Unknown error occurred'
        });
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleGameStop = async (score: number) => {
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

    // Add game to jackpot system (await the promise)
    const updatedRound = await addGameToRound(gameEntry, 0.05);

    // Check if this game won something
    const winnerGame = updatedRound.games.find(g => g.id === gameEntry.id);
    if (winnerGame && winnerGame.prize > 0) {
      toast.success(`INSTANT JACKPOT! You won ${winnerGame.prize.toFixed(2)} SOL!`);
      
      updateStatsForGame(score, winnerGame.prize);
      
      // Note: In a real implementation, the prize distribution would happen
      // automatically from the game treasury wallet to the winner's wallet
      
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
      <div className="relative z-10 container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-6xl">
        {/* Top Navigation Bar - Fixed positioning to avoid overlap */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {/* Help Button */}
          <div className="flex items-center">
            <Button
              onClick={() => setIsHelpModalOpen(true)}
              variant="outline"
              size="sm"
              className="pixel-button border-teal-400/40 text-teal-400 hover:bg-teal-400/10 p-2"
            >
              <img 
                src="/lovable-uploads/b6841ba2-2007-45cb-baec-20c0b5880fe6.png" 
                alt="Help" 
                className="w-6 h-6 pixel-art"
              />
              <span className="hidden sm:inline ml-2">HELP</span>
            </Button>
          </div>
          
          {/* Navigation Pills - Now in the flow */}
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:gap-4 items-center">
            <NavigationPills 
              isConnected={isConnected}
              publicKey={publicKey}
              onConnect={handleConnectWallet}
              onDisconnect={handleDisconnectWallet}
            />
            
            {/* Session Leaderboard - Now inline on mobile */}
            <div className="w-full sm:w-auto">
              <SessionLeaderboard players={sessionPlayers} />
            </div>
          </div>
        </div>
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center items-center gap-2 sm:gap-6 mb-4">
            <img 
              src="/lovable-uploads/afc917a3-89e5-4c59-bf83-19bbecee4d72.png" 
              alt="Gorbagana Grab" 
              className="w-auto h-32 sm:h-48 md:h-64 lg:h-80 pixel-art"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(32, 178, 170, 0.8)) drop-shadow(0 0 40px rgba(32, 178, 170, 0.4)) drop-shadow(0 0 60px rgba(32, 178, 170, 0.2))',
              }}
            />
          </div>

          {/* Game Stats */}
          <div className="mb-6">
            <GameStats 
              prizePool={prizePool}
              timeRemaining={formatTime()}
              gorBalance={gorBalance}
              isConnected={isConnected}
            />
          </div>
        </div>

        {/* Game Area */}
        <div className="mb-6">
          <GameArea
            isPlaying={isPlaying}
            onStop={handleGameStop}
            onStartGame={handleStartGame}
            canPlay={isConnected && balanceLoaded && gorBalance >= 0.05 && !isProcessingPayment}
          />
        </div>

        {/* Processing Payment */}
        {isProcessingPayment && (
          <div className="text-center mb-6 px-2">
            <div className="clean-card border-yellow-400/50 bg-yellow-900/30">
              <p className="text-yellow-300 pixel-font text-xs sm:text-sm">
                PROCESSING PAYMENT...
              </p>
              <p className="text-yellow-500 pixel-font text-xs mt-2">
                Please confirm the transaction in your wallet
              </p>
            </div>
          </div>
        )}

        {/* Balance Warning */}
        {isConnected && balanceLoaded && gorBalance < 0.05 && (
          <div className="text-center px-2">
            <div className="clean-card border-red-400/50 bg-red-900/30">
              <p className="text-red-300 pixel-font text-xs sm:text-sm">
                NEED 0.05 SOL TO PLAY
              </p>
              <p className="text-red-500 pixel-font text-xs mt-2">
                Current balance: {gorBalance.toFixed(4)} SOL
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
