
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, ExternalLink, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { JackpotSystem } from '@/utils/jackpotSystem';

interface Winner {
  player: string;
  prize: number;
  winType: 'jackpot' | 'highest_score' | 'test_prize';
  roundId: string;
  endTime: Date;
  transactionSignature?: string;
}

const PastWinnersPage = () => {
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
          transactionSignature: generateMockTransactionSignature()
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
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
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

  const getWinTypeColor = (winType: string) => {
    switch (winType) {
      case 'jackpot':
        return 'text-yellow-300 bg-yellow-900/30 border-yellow-400/30';
      case 'highest_score':
        return 'text-purple-300 bg-purple-900/30 border-purple-400/30';
      default:
        return 'text-blue-300 bg-blue-900/30 border-blue-400/30';
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="pixel-button border-teal-400/40 text-teal-400 hover:bg-teal-400/10"
          >
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              BACK TO GAME
            </Link>
          </Button>
          <h1 className="pixel-font text-2xl sm:text-3xl text-purple-300">
            🏆 PAST WINNERS
          </h1>
        </div>

        {/* Winners List */}
        {winners.length === 0 ? (
          <Card className="clean-card border-purple-400/30 bg-purple-900/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🏆</div>
                <p className="text-purple-300 pixel-font text-lg mb-2">
                  No winners yet!
                </p>
                <p className="text-purple-500 pixel-font text-sm">
                  Be the first to score 100 and win the jackpot!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {winners.slice(0, 10).map((winner, index) => (
              <Card 
                key={`${winner.roundId}-${index}`}
                className="clean-card border-purple-400/30 bg-purple-900/20"
              >
                <CardContent className="pt-4">
                  <div className="flex flex-col gap-4">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className={`px-3 py-1 rounded-full border pixel-font text-xs ${getWinTypeColor(winner.winType)}`}>
                        {getWinTypeLabel(winner.winType)}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl pixel-font text-yellow-300 font-bold">
                          {winner.prize.toFixed(2)} GOR
                        </div>
                        <div className="text-xs text-purple-500 pixel-font">
                          {winner.endTime.toLocaleDateString()} {winner.endTime.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    {/* Wallet Address Row */}
                    <div className="flex items-center justify-between gap-2 p-3 bg-purple-800/30 rounded-lg border border-purple-400/20">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs text-purple-400 pixel-font">WALLET:</span>
                        <span className="text-sm text-purple-200 pixel-font font-mono">
                          {formatWalletAddress(winner.player)}
                        </span>
                      </div>
                      <Button
                        onClick={() => copyToClipboard(winner.player, 'Wallet address')}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-purple-400 hover:text-purple-300"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Transaction Row */}
                    {winner.transactionSignature && (
                      <div className="flex items-center justify-between gap-2 p-3 bg-purple-800/30 rounded-lg border border-purple-400/20">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-xs text-purple-400 pixel-font">TX:</span>
                          <span className="text-sm text-purple-200 pixel-font font-mono">
                            {winner.transactionSignature.slice(0, 16)}...{winner.transactionSignature.slice(-8)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => copyToClipboard(winner.transactionSignature!, 'Transaction signature')}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-purple-400 hover:text-purple-300"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => window.open(`https://explorer.gorbagana.wtf/tx/${winner.transactionSignature}`, '_blank')}
                            size="sm"
                            variant="ghost"
                            className="h-8 px-3 text-xs pixel-font text-purple-400 hover:text-purple-300 flex items-center gap-1"
                          >
                            VIEW
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {winners.length > 10 && (
              <div className="text-center text-sm text-purple-500 pixel-font">
                Showing latest 10 winners out of {winners.length} total
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PastWinnersPage;
