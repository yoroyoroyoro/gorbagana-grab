
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlayerStats from '@/components/PlayerStats';
import { useBackpackWallet } from '@/hooks/useBackpackWallet';
import { usePlayerStats } from '@/hooks/usePlayerStats';

const PlayerStatsPage = () => {
  const { isConnected, publicKey } = useBackpackWallet();
  const { playerStats } = usePlayerStats(publicKey);

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
        </div>
        
        <PlayerStats
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
