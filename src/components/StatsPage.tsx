
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
    <div>
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
