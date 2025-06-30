
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { JackpotSystem } from '@/utils/jackpotSystem';

interface GameEntry {
  id: string;
  player: string;
  score: number;
  timestamp: Date;
  prize: number;
}

export const useJackpotRound = () => {
  const [prizePool, setPrizePool] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(86400);

  // Initialize or get current round and update prize pool
  useEffect(() => {
    const initializeRound = async () => {
      let round = JackpotSystem.getCurrentRound();
      if (!round) {
        const currentBalance = await JackpotSystem.getPrizePool();
        round = JackpotSystem.initializeRound(currentBalance);
      }
      
      // Always get the latest treasury balance as prize pool
      const currentPrizePool = await JackpotSystem.getPrizePool();
      setPrizePool(currentPrizePool);
      setTimeRemaining(JackpotSystem.getTimeRemaining(round));
    };

    initializeRound();
  }, []);

  // Update prize pool every 10 seconds to reflect treasury balance
  useEffect(() => {
    const updatePrizePool = async () => {
      const currentBalance = await JackpotSystem.getPrizePool();
      setPrizePool(currentBalance);
    };

    const interval = setInterval(updatePrizePool, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // TESTING: Simulate prize distribution without actual Solana transaction
  const simulatePrizeDistribution = async (winner: { player: string; prize: number; winType: string }) => {
    try {
      console.log(`SIMULATING: ${winner.prize.toFixed(2)} SOL distribution to ${winner.player}`);
      
      // Simulate a successful transaction with a fake signature
      const fakeTransactionSignature = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`SIMULATION: Prize distributed successfully! Mock Transaction: ${fakeTransactionSignature}`);
      toast.success(`🎉 PRIZE SIMULATED! ${winner.player.slice(0, 6)}...${winner.player.slice(-4)} would receive ${winner.prize.toFixed(2)} SOL!`, {
        description: `Mock Transaction: ${fakeTransactionSignature.slice(0, 8)}...${fakeTransactionSignature.slice(-8)}`,
        duration: 10000
      });
      
      // Update prize pool to 0 to simulate treasury being emptied
      setTimeout(() => {
        setPrizePool(0);
      }, 2000);
      
      return true;
      
    } catch (error) {
      console.error('Failed to simulate prize distribution:', error);
      toast.error('Prize simulation failed');
      return false;
    }
  };

  // Timer countdown and round management
  useEffect(() => {
    const timer = setInterval(async () => {
      const round = JackpotSystem.getCurrentRound();
      if (!round) return;

      const remaining = JackpotSystem.getTimeRemaining(round);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        // Check and end expired round
        const result = JackpotSystem.checkAndEndExpiredRound();
        if (result.roundEnded) {
          if (result.winner) {
            // Get current treasury balance for the actual prize amount
            const treasuryBalance = await JackpotSystem.getPrizePool();
            const winnerWithPrize = {
              ...result.winner,
              prize: treasuryBalance
            };
            
            toast.success(
              `⏰ ROUND ENDED! ${winnerWithPrize.player.slice(0, 6)}...${winnerWithPrize.player.slice(-4)} won ${winnerWithPrize.prize.toFixed(2)} SOL with score ${winnerWithPrize.score}!`,
              { duration: 8000 }
            );
            
            // Simulate the prize distribution for round end winners too
            const distributed = await simulatePrizeDistribution(winnerWithPrize);
            
            // Initialize new round after distribution
            if (distributed) {
              setTimeout(async () => {
                const currentBalance = await JackpotSystem.getPrizePool();
                const newRound = JackpotSystem.initializeRound(currentBalance);
                setPrizePool(currentBalance);
                setTimeRemaining(JackpotSystem.getTimeRemaining(newRound));
              }, 3000);
            }
          } else {
            toast.success('Round ended! No games were played.');
            
            // Initialize new round even if no winner
            const currentBalance = await JackpotSystem.getPrizePool();
            const newRound = JackpotSystem.initializeRound(currentBalance);
            setPrizePool(currentBalance);
            setTimeRemaining(JackpotSystem.getTimeRemaining(newRound));
          }
          
          // Trigger a custom event to notify other components
          window.dispatchEvent(new CustomEvent('roundEnded', { detail: result }));
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const addGameToRound = async (gameEntry: GameEntry, paymentAmount: number) => {
    console.log(`Adding game to round - Player: ${gameEntry.player}, Score: ${gameEntry.score}`);
    
    const updatedRound = await JackpotSystem.addGameToRound(gameEntry, paymentAmount);
    
    // Update prize pool to reflect current treasury balance
    const currentBalance = await JackpotSystem.getPrizePool();
    setPrizePool(currentBalance);
    
    // TESTING: Award prize for ANY score (not just 100)
    console.log('🎰 TESTING MODE: Awarding prize for any score!');
    
    const winnerWithCurrentPrize = {
      player: gameEntry.player,
      score: gameEntry.score,
      prize: currentBalance,
      winType: 'test_prize' as const
    };
    
    console.log('TEST PRIZE! Simulating prize distribution:', winnerWithCurrentPrize);
    
    // Show immediate prize notification
    toast.success(`🎰 TEST PRIZE! ${gameEntry.player.slice(0, 6)}...${gameEntry.player.slice(-4)} scored ${gameEntry.score}! Simulating ${currentBalance.toFixed(2)} SOL distribution...`, {
      duration: 8000
    });
    
    // Simulate the prize distribution immediately
    const distributed = await simulatePrizeDistribution(winnerWithCurrentPrize);
    
    if (distributed) {
      // Initialize new round with current treasury balance after simulation
      setTimeout(async () => {
        const newBalance = await JackpotSystem.getPrizePool();
        const newRound = JackpotSystem.initializeRound(newBalance);
        setPrizePool(newBalance);
        setTimeRemaining(JackpotSystem.getTimeRemaining(newRound));
      }, 3000);
      
      // Trigger a custom event to notify other components about prize
      window.dispatchEvent(new CustomEvent('jackpotWon', { detail: winnerWithCurrentPrize }));
    }
    
    return updatedRound;
  };

  const formatTime = () => {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const resetTimeForNewRound = () => {
    setTimeRemaining(86400);
  };

  return {
    prizePool,
    timeRemaining,
    formatTime,
    addGameToRound,
    resetTimeForNewRound
  };
};
