
import { Trophy } from 'lucide-react';

interface SessionPlayer {
  publicKey: string;
  bestScore: number;
  gamesPlayed: number;
}

interface SessionLeaderboardProps {
  players: SessionPlayer[];
}

const SessionLeaderboard = ({ players }: SessionLeaderboardProps) => {
  if (players.length === 0) {
    return null;
  }

  const sortedPlayers = [...players]
    .sort((a, b) => b.bestScore - a.bestScore)
    .slice(0, 5); // Show top 5

  return (
    <div className="w-full sm:w-auto min-w-0">
      <div className="clean-card border-purple-400/50 bg-purple-900/30">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-purple-300 flex-shrink-0" />
          <h3 className="pixel-font text-purple-300 text-xs sm:text-sm font-bold">
            SESSION TOP
          </h3>
        </div>
        
        <div className="space-y-2">
          {sortedPlayers.map((player, index) => (
            <div 
              key={player.publicKey} 
              className="flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-purple-400 pixel-font flex-shrink-0">
                  #{index + 1}
                </span>
                <span className="text-purple-200 pixel-font truncate">
                  <span className="hidden sm:inline">
                    {player.publicKey.slice(0, 4)}...{player.publicKey.slice(-4)}
                  </span>
                  <span className="sm:hidden">
                    {player.publicKey.slice(0, 3)}..
                  </span>
                </span>
              </div>
              <span className="text-purple-300 pixel-font font-bold flex-shrink-0">
                {player.bestScore}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SessionLeaderboard;
