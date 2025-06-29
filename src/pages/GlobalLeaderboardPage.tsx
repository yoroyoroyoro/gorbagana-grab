
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LeaderboardPage from '@/components/LeaderboardPage';

interface LeaderboardEntry {
  rank: number;
  address: string;
  totalWinnings: number;
  gamesWon: number;
}

const GlobalLeaderboardPage = () => {
  const [leaderboard] = useState<LeaderboardEntry[]>([
    { rank: 1, address: '8K7qX2vN9mB3pL4wR5tY6uI7oP8aS9dF', totalWinnings: 23.45, gamesWon: 12 },
    { rank: 2, address: '9M4tE6rY8uI3oP2aS7dF5gH1jK9lZ3xC', totalWinnings: 18.92, gamesWon: 8 },
    { rank: 3, address: '7B2nV5mK9lP4wR8tY3uI6oS1aD4fG7hJ', totalWinnings: 15.67, gamesWon: 6 },
    { rank: 4, address: '6C8vB4nM2kL9pW5rT7yU1iO3sA6dF9gH', totalWinnings: 12.34, gamesWon: 4 },
    { rank: 5, address: '5F3gH7jK1lZ9xC2vB8nM4kP6wR5tY9uI', totalWinnings: 9.81, gamesWon: 3 }
  ]);

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
          <h1 className="text-2xl md:text-3xl font-bold pixel-font-xl text-teal-300 neon-text">
            GLOBAL LEADERBOARD
          </h1>
        </div>
        
        <LeaderboardPage players={leaderboard} />
      </div>
    </div>
  );
};

export default GlobalLeaderboardPage;
