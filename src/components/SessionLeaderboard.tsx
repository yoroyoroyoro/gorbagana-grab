
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
      case 1: return <Trophy className="w-5 h-5 text-teal-300" />;
      case 2: return <Medal className="w-5 h-5 text-cyan-300" />;
      case 3: return <Award className="w-5 h-5 text-emerald-300" />;
      default: return <span className="w-5 text-center font-bold text-slate-400 pixel-font">{rank}</span>;
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
      <div className="w-full max-w-4xl mx-auto">
        <div className="clean-card text-center">
          <h2 className="text-xl font-bold text-teal-300 pixel-font mb-4 flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6" />
            SESSION LEADERBOARD
          </h2>
          <div className="text-slate-400 pixel-font">
            No scores yet this round. Be the first to play!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="clean-card">
        <h2 className="text-xl font-bold text-teal-300 pixel-font mb-6 flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6" />
          SESSION LEADERBOARD
        </h2>
        
        <div className="space-y-3">
          {players.slice(0, 10).map((player, index) => {
            const rank = index + 1;
            return (
              <div 
                key={`${player.player}-${player.timestamp.getTime()}`}
                className={`flex items-center justify-between p-4 rounded-lg border ${getRankColor(rank)} backdrop-blur-sm`}
              >
                <div className="flex items-center gap-4">
                  {getRankIcon(rank)}
                  <div>
                    <div className="font-mono text-sm text-slate-200 pixel-font">
                      {player.player.slice(0, 6)}...{player.player.slice(-4)}
                    </div>
                    <div className="text-xs text-slate-500 pixel-font flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {player.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`font-bold text-2xl pixel-font ${getScoreColor(player.bestScore)}`}>
                    {player.bestScore}
                  </div>
                  <div className="text-xs text-slate-500 pixel-font">
                    BEST SCORE
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {players.length > 10 && (
          <div className="mt-4 text-center text-slate-400 pixel-font text-sm">
            And {players.length - 10} more players...
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionLeaderboard;
