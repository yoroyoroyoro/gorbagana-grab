
import { useState, useEffect } from 'react';

interface PlayerData {
  walletAddress: string;
  totalWinnings: number;
  gamesPlayed: number;
  bestScore: number;
  winRate: number;
}

export const usePlayerStats = (publicKey: string | null) => {
  const [playerStats, setPlayerStats] = useState<PlayerData>({
    walletAddress: '',
    totalWinnings: 0,
    gamesPlayed: 0,
    bestScore: 0,
    winRate: 0
  });

  useEffect(() => {
    if (publicKey) {
      loadPlayerStats();
    }
  }, [publicKey]);

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

  const updateStatsForGame = (score: number, prize: number = 0) => {
    const updatedStats = {
      ...playerStats,
      gamesPlayed: playerStats.gamesPlayed + 1,
      totalWinnings: playerStats.totalWinnings + prize,
      bestScore: Math.max(playerStats.bestScore, score),
      winRate: prize > 0 ? 
        ((playerStats.gamesPlayed * playerStats.winRate / 100) + 1) / (playerStats.gamesPlayed + 1) * 100 :
        playerStats.winRate
    };
    savePlayerStats(updatedStats);
  };

  const updateBestScore = (score: number) => {
    const updatedStats = {
      ...playerStats,
      bestScore: Math.max(playerStats.bestScore, score)
    };
    savePlayerStats(updatedStats);
  };

  return {
    playerStats,
    updateStatsForGame,
    updateBestScore
  };
};
