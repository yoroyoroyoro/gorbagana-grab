
import { useState, useEffect } from 'react';
import { JackpotSystem } from '@/utils/jackpotSystem';

interface SessionLeaderEntry {
  player: string;
  bestScore: number;
  timestamp: Date;
}

export const useSessionLeaderboard = () => {
  const [sessionLeaderboard, setSessionLeaderboard] = useState<SessionLeaderEntry[]>([]);

  useEffect(() => {
    const round = JackpotSystem.getCurrentRound();
    if (round) {
      loadSessionLeaderboard(round.roundId);
    }
  }, []);

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

  const clearSessionLeaderboard = (roundId?: string) => {
    setSessionLeaderboard([]);
    if (roundId) {
      localStorage.removeItem(`sessionLeaderboard_${roundId}`);
    }
  };

  return {
    sessionLeaderboard,
    updateSessionLeaderboard,
    clearSessionLeaderboard,
    loadSessionLeaderboard
  };
};
