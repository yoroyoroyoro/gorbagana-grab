
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  address: string;
  totalWinnings: number;
  gamesWon: number;
}

interface LeaderboardProps {
  players: LeaderboardEntry[];
}

const Leaderboard = ({ players }: LeaderboardProps) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-accent" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 text-center font-bold text-muted-foreground">{rank}</span>;
    }
  };

  return (
    <Card className="bg-card/50 border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          Global Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {players.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No players yet. Be the first to play!
          </div>
        ) : (
          <div className="space-y-2">
            {players.map((player) => (
              <div 
                key={player.address}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  player.rank <= 3 ? 'bg-accent/10 border border-accent/20' : 'bg-background/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getRankIcon(player.rank)}
                  <div>
                    <div className="font-mono text-sm">
                      {player.address.slice(0, 6)}...{player.address.slice(-4)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {player.gamesWon} wins
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-accent">
                    {player.totalWinnings.toFixed(2)} GOR
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
