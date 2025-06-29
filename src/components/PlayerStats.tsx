
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
              <span className="text-sm text-muted-foreground">Total Winnings</span>
            </div>
            <div className="text-lg font-bold text-accent">
              {totalWinnings.toFixed(2)} SOL
            </div>
          </div>
          
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Best Score</span>
            </div>
            <div className="text-lg font-bold text-primary">
              {bestScore}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Games Played</div>
            <div className="text-lg font-bold">{gamesPlayed}</div>
          </div>
          
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Win Rate</div>
            <div className="text-lg font-bold">{winRate.toFixed(1)}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerStats;
