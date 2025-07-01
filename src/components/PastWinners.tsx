
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { JackpotSystem } from '@/utils/jackpotSystem';

interface Winner {
  player: string;
  prize: number;
  winType: 'jackpot' | 'highest_score' | 'test_prize';
  roundId: string;
  endTime: Date;
  transactionSignature?: string;
}

const PastWinners = () => {
  const [winners, setWinners] = useState<Winner[]>([]);

  useEffect(() => {
    loadPastWinners();
  }, []);

  const loadPastWinners = () => {
    const roundsHistory = JackpotSystem.getRoundsHistory();
    const pastWinners: Winner[] = [];

    roundsHistory.forEach(round => {
      if (round.winner) {
        pastWinners.push({
          player: round.winner.player,
          prize: round.winner.prize,
          winType: round.winner.winType,
          roundId: round.roundId,
          endTime: round.endTime,
          transactionSignature: generateMockTransactionSignature() // In real app, this would come from the round data
        });
      }
    });

    setWinners(pastWinners);
  };

  // Mock transaction signature generator for demonstration
  const generateMockTransactionSignature = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 88; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard!`);
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getWinTypeLabel = (winType: string) => {
    switch (winType) {
      case 'jackpot':
        return 'PERFECT SCORE';
      case 'highest_score':
        return 'ROUND WINNER';
      default:
        return 'WINNER';
    }
  };

  if (winners.length === 0) {
    return (
      <Card className="clean-card border-purple-400/30 bg-purple-900/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-purple-300 pixel-font text-sm sm:text-base">
            🏆 PAST WINNERS
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-center text-purple-500 pixel-font text-xs">
            No winners yet - be the first!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="clean-card border-purple-400/30 bg-purple-900/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-center text-purple-300 pixel-font text-sm sm:text-base">
          🏆 PAST WINNERS
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {winners.slice(0, 5).map((winner, index) => (
          <div 
            key={`${winner.roundId}-${index}`}
            className="border border-purple-400/20 rounded-lg p-3 bg-purple-800/20"
          >
            <div className="flex flex-col gap-2">
              {/* Winner Type and Prize */}
              <div className="flex justify-between items-center">
                <span className="text-xs pixel-font text-purple-300">
                  {getWinTypeLabel(winner.winType)}
                </span>
                <span className="text-sm pixel-font text-yellow-300 font-bold">
                  {winner.prize.toFixed(2)} GOR
                </span>
              </div>

              {/* Wallet Address */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-purple-400 pixel-font min-w-0 flex-1">
                  {formatWalletAddress(winner.player)}
                </span>
                <Button
                  onClick={() => copyToClipboard(winner.player, 'Wallet address')}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-purple-400 hover:text-purple-300"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              {/* Transaction Link */}
              {winner.transactionSignature && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-purple-500 pixel-font">TX:</span>
                  <Button
                    onClick={() => window.open(`https://explorer.gorbagana.wtf/tx/${winner.transactionSignature}`, '_blank')}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs pixel-font text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    {winner.transactionSignature.slice(0, 8)}...
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Date */}
              <div className="text-xs text-purple-600 pixel-font">
                {winner.endTime.toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}

        {winners.length > 5 && (
          <div className="text-center text-xs text-purple-500 pixel-font">
            Showing latest 5 winners
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PastWinners;
