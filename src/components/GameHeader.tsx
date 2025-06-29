
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Trophy, Timer } from 'lucide-react';

interface GameHeaderProps {
  prizePool: number;
  timeRemaining: number;
  isWalletConnected: boolean;
  walletAddress?: string;
  onConnectWallet: () => void;
}

const GameHeader = ({ 
  prizePool, 
  timeRemaining, 
  isWalletConnected, 
  walletAddress,
  onConnectWallet 
}: GameHeaderProps) => {
  const [timeDisplay, setTimeDisplay] = useState('');

  useEffect(() => {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    setTimeDisplay(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  }, [timeRemaining]);

  return (
    <div className="w-full bg-card/50 backdrop-blur-sm border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Prize Pool */}
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-accent" />
          <div>
            <div className="text-sm text-muted-foreground">Prize Pool</div>
            <div className="text-2xl font-bold text-accent neon-text">
              {prizePool.toFixed(2)} GOR
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-3">
          <Timer className="w-6 h-6 text-primary" />
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Round Ends In</div>
            <div className="text-xl font-mono text-primary font-bold">
              {timeDisplay}
            </div>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="flex items-center gap-3">
          {isWalletConnected ? (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Connected</div>
              <div className="text-sm font-mono">
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </div>
            </div>
          ) : (
            <Button 
              onClick={onConnectWallet}
              className="bg-primary hover:bg-primary/80 text-primary-foreground"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
