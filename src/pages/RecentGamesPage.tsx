import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RecentGamesPage from '@/components/RecentGamesPage';

interface GameEntry {
  id: string;
  player: string;
  score: number;
  timestamp: Date;
  prize: number;
}

const RecentGamesPageRoute = () => {
  const [recentGames, setRecentGames] = useState<GameEntry[]>([]);

  useEffect(() => {
    const savedGames = localStorage.getItem('recentGames');
    if (savedGames) {
      const games = JSON.parse(savedGames);
      const gamesWithDates = games.map((game: any) => ({
        ...game,
        timestamp: new Date(game.timestamp)
      }));
      setRecentGames(gamesWithDates);
    }
  }, []);

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
        
        <RecentGamesPage games={recentGames} />
      </div>
    </div>
  );
};

export default RecentGamesPageRoute;
