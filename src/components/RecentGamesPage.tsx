
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
    <div>
      <RecentGames games={games} />
    </div>
  );
};

export default RecentGamesPage;
