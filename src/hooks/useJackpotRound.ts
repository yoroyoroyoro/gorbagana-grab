
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

  // Initialize or get current round
  useEffect(() => {
    let round = JackpotSystem.getCurrentRound();
    if (!round) {
      round = JackpotSystem.initializeRound(0);
    }
    setPrizePool(round.prizePool);
    setTimeRemaining(JackpotSystem.getTimeRemaining(round));
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
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const addGameToRound = (gameEntry: GameEntry, paymentAmount: number) => {
    const updatedRound = JackpotSystem.addGameToRound(gameEntry, paymentAmount);
    setPrizePool(updatedRound.prizePool);
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
