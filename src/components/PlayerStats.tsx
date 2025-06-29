
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target, Coins } from 'lucide-react';

interface PlayerStatsProps {
  walletAddress?: string;
  totalWinnings: number;
  gamesPlayed: number;
  bestScore: number;
  winRate: number;
}

const PlayerStats = ({ 
  walletAddress, 
  totalWinnings, 
  gamesPlayed, 
  bestScore, 
  winRate 
}: PlayerStatsProps) => {
  if (!walletAddress) {
    return (
      <Card className="bg-card/50 border border-border">
        <CardHeader>
          <CardTitle className="text-center text-muted-foreground">
            Connect your wallet to view stats
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Player Profile
        </CardTitle>
        <p className="text-sm text-muted-foreground font-mono">
          {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Coins className="w-4 h-4 text-accent" />
            </div>
            <div className="text-lg font-bold text-accent">
              {totalWinnings.toFixed(2)} GOR
            </div>
            <div className="text-xs text-muted-foreground">Total Winnings</div>
          </div>
          
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <div className="text-lg font-bold text-primary">
              {bestScore}
            </div>
            <div className="text-xs text-muted-foreground">Best Score</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-lg font-bold">{gamesPlayed}</div>
            <div className="text-xs text-muted-foreground">Games Played</div>
          </div>
          
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-lg font-bold">{winRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerStats;
