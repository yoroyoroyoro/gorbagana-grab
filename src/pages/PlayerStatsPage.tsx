
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsPage from '@/components/StatsPage';
import { useBackpackWallet } from '@/hooks/useBackpackWallet';
import { gorConnection } from '@/utils/gorConnection';
import { PublicKey } from '@solana/web3.js';

interface PlayerData {
  walletAddress: string;
  totalWinnings: number;
  gamesPlayed: number;
  bestScore: number;
  winRate: number;
}

const PlayerStatsPage = () => {
  const { isConnected, publicKey } = useBackpackWallet();
  const [playerStats, setPlayerStats] = useState<PlayerData>({
    walletAddress: '',
    totalWinnings: 0,
    gamesPlayed: 0,
    bestScore: 0,
    winRate: 0
  });

  useEffect(() => {
    if (isConnected && publicKey) {
      const savedStats = localStorage.getItem(`playerStats_${publicKey}`);
      if (savedStats) {
        setPlayerStats(JSON.parse(savedStats));
      }
    }
  }, [isConnected, publicKey]);

  return (
    <div className="page-container">
      <div className="relative z-10 container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button asChild variant="outline" size="sm" className="pixel-pill">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              BACK TO GAME
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold pixel-font-xl text-teal-300">
            PLAYER STATISTICS
          </h1>
        </div>
        
        <StatsPage
          walletAddress={publicKey}
          totalWinnings={playerStats.totalWinnings}
          gamesPlayed={playerStats.gamesPlayed}
          bestScore={playerStats.bestScore}
          winRate={playerStats.winRate}
        />
      </div>
    </div>
  );
};

export default PlayerStatsPage;
