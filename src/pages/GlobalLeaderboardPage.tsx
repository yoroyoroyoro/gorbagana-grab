
import { useState, useEffect } from 'react';
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    // Get all player stats from localStorage and create leaderboard
    const allStats: LeaderboardEntry[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('playerStats_')) {
        const stats = JSON.parse(localStorage.getItem(key) || '{}');
        const address = key.replace('playerStats_', '');
        
        // Only include players with actual winnings
        if (stats.totalWinnings > 0) {
          allStats.push({
            rank: 0, // Will be set after sorting
            address,
            totalWinnings: stats.totalWinnings,
            gamesWon: stats.totalWinnings > 0 ? 1 : 0 // Count games with winnings
          });
        }
      }
    }

    // Sort by total winnings and assign ranks
    const sortedStats = allStats
      .sort((a, b) => b.totalWinnings - a.totalWinnings)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

    setLeaderboard(sortedStats);
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
          <h1 className="text-2xl md:text-3xl font-bold pixel-font-xl text-teal-300">
            GLOBAL LEADERBOARD
          </h1>
        </div>
        
        <LeaderboardPage players={leaderboard} />
      </div>
    </div>
  );
};

export default GlobalLeaderboardPage;
