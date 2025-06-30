
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { JackpotSystem } from '@/utils/jackpotSystem';
import { supabase } from '@/integrations/supabase/client';

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

  // Real prize distribution using Supabase Edge Function
  const distributePrize = async (winner: { player: string; prize: number; winType: string; gameId: string }) => {
    try {
      console.log(`REAL DISTRIBUTION: ${winner.prize.toFixed(2)} SOL to ${winner.player}`);
      
      // Call the Supabase Edge Function for real prize distribution
      const { data, error } = await supabase.functions.invoke('distribute-prize', {
        body: {
          winner_wallet: winner.player,
          prize_amount: winner.prize,
          game_id: winner.gameId,
          win_type: winner.winType
        }
      });

      if (error) {
        console.error('Prize distribution failed:', error);
        toast.error('Failed to distribute prize automatically. Please contact support.');
        return false;
      }

      if (data?.success) {
        console.log('Prize distributed successfully!', data);
        toast.success(`🎉 PRIZE DISTRIBUTED! ${winner.player.slice(0, 6)}...${winner.player.slice(-4)} received ${winner.prize.toFixed(2)} SOL!`, {
          description: `Transaction: ${data.transaction_signature?.slice(0, 8)}...${data.transaction_signature?.slice(-8)}`,
          duration: 10000
        });
        
        // Update prize pool to 0 since treasury was emptied
        setTimeout(() => {
          setPrizePool(0);
        }, 2000);
        
        return true;
      } else {
        console.error('Prize distribution failed:', data);
        toast.error('Failed to distribute prize automatically. Please contact support.');
        return false;
      }
      
    } catch (error) {
      console.error('Failed to distribute prize:', error);
      toast.error('Failed to distribute prize automatically. Please contact support.');
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
              prize: treasuryBalance,
              gameId: `round_end_${Date.now()}`
            };
            
            toast.success(
              `⏰ ROUND ENDED! ${winnerWithPrize.player.slice(0, 6)}...${winnerWithPrize.player.slice(-4)} won ${winnerWithPrize.prize.toFixed(2)} SOL with score ${winnerWithPrize.score}!`,
              { duration: 8000 }
            );
            
            // Real prize distribution for round end winners
            const distributed = await distributePrize(winnerWithPrize);
            
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
    
    // Check for PERFECT SCORE JACKPOT (100 points)
    if (gameEntry.score === 100) {
      console.log('🎰 PERFECT SCORE JACKPOT! Score: 100 - Awarding ALL treasury funds!');
      
      const winnerWithCurrentPrize = {
        player: gameEntry.player,
        score: gameEntry.score,
        prize: currentBalance,
        winType: 'jackpot' as const,
        gameId: gameEntry.id
      };
      
      console.log('REAL JACKPOT DISTRIBUTION! Calling Edge Function:', winnerWithCurrentPrize);
      
      // Show immediate jackpot notification
      toast.success(`🎰 PERFECT JACKPOT! ${gameEntry.player.slice(0, 6)}...${gameEntry.player.slice(-4)} scored 100! Initiating ${currentBalance.toFixed(2)} SOL transfer...`, {
        duration: 8000
      });
      
      // Real prize distribution immediately
      const distributed = await distributePrize(winnerWithCurrentPrize);
      
      if (distributed) {
        // Initialize new round with current treasury balance after distribution
        setTimeout(async () => {
          const newBalance = await JackpotSystem.getPrizePool();
          const newRound = JackpotSystem.initializeRound(newBalance);
          setPrizePool(newBalance);
          setTimeRemaining(JackpotSystem.getTimeRemaining(newRound));
        }, 3000);
        
        // Trigger a custom event to notify other components about jackpot
        window.dispatchEvent(new CustomEvent('jackpotWon', { detail: winnerWithCurrentPrize }));
      }
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
