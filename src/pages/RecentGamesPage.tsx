
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
    // In a real app, you would fetch this from your backend
    // For now, we'll use localStorage or mock data
    const savedGames = localStorage.getItem('recentGames');
    if (savedGames) {
      const games = JSON.parse(savedGames);
      // Convert timestamp strings back to Date objects
      const gamesWithDates = games.map((game: any) => ({
        ...game,
        timestamp: new Date(game.timestamp)
      }));
      setRecentGames(gamesWithDates);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button asChild variant="outline" size="sm">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Game
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Recent Games</h1>
        </div>
        
        <RecentGamesPage games={recentGames} />
      </div>
    </div>
  );
};

export default RecentGamesPageRoute;
