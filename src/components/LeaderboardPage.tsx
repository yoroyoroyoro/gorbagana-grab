
import Leaderboard from '@/components/Leaderboard';

interface LeaderboardEntry {
  rank: number;
  address: string;
  totalWinnings: number;
  gamesWon: number;
}

interface LeaderboardPageProps {
  players: LeaderboardEntry[];
}

const LeaderboardPage = ({ players }: LeaderboardPageProps) => {
  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6">Global Leaderboard</h2>
      <Leaderboard players={players} />
    </div>
  );
};

export default LeaderboardPage;
