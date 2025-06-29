
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Target } from 'lucide-react';

interface GameEntry {
  id: string;
  player: string;
  score: number;
  timestamp: Date;
  prize: number;
}

interface RecentGamesProps {
  games: GameEntry[];
}

const RecentGames = ({ games }: RecentGamesProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getScoreColor = (score: number) => {
    if (score === 100) return 'text-accent';
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="bg-card/50 border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Recent Games
        </CardTitle>
      </CardHeader>
      <CardContent>
        {games.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No games played yet in this round.
          </div>
        ) : (
          <div className="space-y-3">
            {games.map((game) => (
              <div 
                key={game.id}
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-mono text-sm">
                      {game.player.slice(0, 6)}...{game.player.slice(-4)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(game.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${getScoreColor(game.score)}`}>
                    {game.score}
                  </div>
                  {game.prize > 0 && (
                    <div className="text-xs text-accent">
                      Won {game.prize.toFixed(2)} GOR
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentGames;
