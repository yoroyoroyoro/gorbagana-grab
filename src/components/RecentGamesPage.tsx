
import RecentGames from '@/components/RecentGames';

interface GameEntry {
  id: string;
  player: string;
  score: number;
  timestamp: Date;
  prize: number;
}

interface RecentGamesPageProps {
  games: GameEntry[];
}

const RecentGamesPage = ({ games }: RecentGamesPageProps) => {
  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6">Recent Games</h2>
      <RecentGames games={games} />
    </div>
  );
};

export default RecentGamesPage;
