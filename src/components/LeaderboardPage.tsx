
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
    <div>
      <Leaderboard players={players} />
    </div>
  );
};

export default LeaderboardPage;
