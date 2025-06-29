
import PlayerStats from '@/components/PlayerStats';

interface StatsPageProps {
  walletAddress?: string;
  totalWinnings: number;
  gamesPlayed: number;
  bestScore: number;
  winRate: number;
}

const StatsPage = ({ 
  walletAddress, 
  totalWinnings, 
  gamesPlayed, 
  bestScore, 
  winRate 
}: StatsPageProps) => {
  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6">Player Statistics</h2>
      <PlayerStats
        walletAddress={walletAddress}
        totalWinnings={totalWinnings}
        gamesPlayed={gamesPlayed}
        bestScore={bestScore}
        winRate={winRate}
      />
    </div>
  );
};

export default StatsPage;
