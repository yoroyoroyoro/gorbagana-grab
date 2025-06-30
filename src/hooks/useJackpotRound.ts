
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

  // Initialize or get current round
  useEffect(() => {
    let round = JackpotSystem.getCurrentRound();
    if (!round) {
      round = JackpotSystem.initializeRound(0);
    }
    setPrizePool(round.prizePool);
    setTimeRemaining(JackpotSystem.getTimeRemaining(round));
  }, []);

  const distributePrize = async (winner: { player: string; prize: number; winType: string }) => {
    try {
      console.log(`Distributing ${winner.prize.toFixed(2)} GOR to ${winner.player}`);
      
      // Call the edge function to distribute the prize
      const { data, error } = await supabase.functions.invoke('distribute-prize', {
        body: {
          winner_wallet: winner.player,
          prize_amount: winner.prize,
          game_id: `${Date.now()}-${winner.player.slice(-6)}`
        }
      });

      if (error) {
        console.error('Prize distribution failed:', error);
        toast.error('Failed to distribute prize automatically. Please contact support.');
        return;
      }

      if (data?.success) {
        console.log(`Prize distributed successfully! Transaction: ${data.transaction_signature}`);
        toast.success(`Prize distributed! ${winner.player.slice(0, 6)}...${winner.player.slice(-4)} received ${winner.prize.toFixed(2)} GOR!`, {
          description: `Transaction: ${data.transaction_signature.slice(0, 8)}...${data.transaction_signature.slice(-8)}`
        });
      } else {
        console.error('Prize distribution failed:', data);
        toast.error('Failed to distribute prize automatically. Please contact support.');
      }
      
    } catch (error) {
      console.error('Failed to distribute prize:', error);
      toast.error('Failed to distribute prize automatically. Please contact support.');
    }
  };

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
            
            // Distribute the prize automatically
            distributePrize(result.winner);
          } else {
            toast.success('Round ended! No games were played.');
          }
          
          // Initialize new round and reset everything
          const newRound = JackpotSystem.initializeRound(0);
          setPrizePool(newRound.prizePool);
          setTimeRemaining(JackpotSystem.getTimeRemaining(newRound));
          
          // Trigger a custom event to notify other components
          window.dispatchEvent(new CustomEvent('roundEnded', { detail: result }));
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const addGameToRound = (gameEntry: GameEntry, paymentAmount: number) => {
    const updatedRound = JackpotSystem.addGameToRound(gameEntry, paymentAmount);
    setPrizePool(updatedRound.prizePool);
    
    // If there's a winner (jackpot), distribute the prize automatically
    if (updatedRound.winner) {
      distributePrize(updatedRound.winner);
      
      // Trigger a custom event to notify other components about jackpot
      window.dispatchEvent(new CustomEvent('jackpotWon', { detail: updatedRound.winner }));
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
