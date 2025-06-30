
import { Trophy, Medal, Award, Clock } from 'lucide-react';

interface SessionLeaderEntry {
  player: string;
  bestScore: number;
  timestamp: Date;
}

interface SessionLeaderboardProps {
  players: SessionLeaderEntry[];
}

const SessionLeaderboard = ({ players }: SessionLeaderboardProps) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-4 h-4 text-teal-300" />;
      case 2: return <Medal className="w-4 h-4 text-cyan-300" />;
      case 3: return <Award className="w-4 h-4 text-emerald-300" />;
      default: return <span className="w-4 text-center font-bold text-slate-400 pixel-font text-xs">{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'border-teal-400/40 bg-teal-900/20';
      case 2: return 'border-cyan-400/40 bg-cyan-900/20';
      case 3: return 'border-emerald-400/40 bg-emerald-900/20';
      default: return 'border-slate-600/40 bg-slate-800/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score === 100) return 'text-teal-300';
    if (score >= 90) return 'text-cyan-300';
    if (score >= 70) return 'text-emerald-300';
    if (score >= 50) return 'text-yellow-300';
    return 'text-red-300';
  };

  if (players.length === 0) {
    return (
      <div className="w-64">
        <div className="clean-card text-center">
          <h3 className="text-sm font-bold text-teal-300 pixel-font mb-2 flex items-center justify-center gap-1">
            <Trophy className="w-4 h-4" />
            SESSION BOARD
          </h3>
          <div className="text-slate-400 pixel-font text-xs">
            No scores yet
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64">
      <div className="clean-card">
        <h3 className="text-sm font-bold text-teal-300 pixel-font mb-3 flex items-center justify-center gap-1">
          <Trophy className="w-4 h-4" />
          SESSION BOARD
        </h3>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {players.slice(0, 5).map((player, index) => {
            const rank = index + 1;
            return (
              <div 
                key={`${player.player}-${player.timestamp.getTime()}`}
                className={`flex items-center justify-between p-2 rounded border ${getRankColor(rank)} backdrop-blur-sm`}
              >
                <div className="flex items-center gap-2">
                  {getRankIcon(rank)}
                  <div>
                    <div className="font-mono text-xs text-slate-200 pixel-font">
                      {player.player.slice(0, 4)}...{player.player.slice(-3)}
                    </div>
                    <div className="text-xs text-slate-500 pixel-font flex items-center gap-1">
                      <Clock className="w-2 h-2" />
                      {player.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`font-bold text-lg pixel-font ${getScoreColor(player.bestScore)}`}>
                    {player.bestScore}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {players.length > 5 && (
          <div className="mt-2 text-center text-slate-400 pixel-font text-xs">
            +{players.length - 5} more
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionLeaderboard;
