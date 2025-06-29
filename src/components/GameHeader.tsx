
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
    <div className="w-full bg-card/80 backdrop-blur-sm pixel-border p-4 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Prize Pool */}
        <div className="flex items-center gap-3 pixel-border bg-background/40 p-3 rounded-none">
          <Trophy className="w-6 h-6 text-accent pixel-art" />
          <div>
            <div className="text-sm text-muted-foreground pixel-font">Prize Pool</div>
            <div className="text-2xl font-bold text-accent neon-text pixel-font">
              {prizePool.toFixed(2)} GOR
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-3 pixel-border bg-background/40 p-3 rounded-none">
          <Timer className="w-6 h-6 text-primary pixel-art" />
          <div className="text-center">
            <div className="text-sm text-muted-foreground pixel-font">Round Ends In</div>
            <div className="text-xl font-mono text-primary font-bold pixel-font neon-text">
              {timeDisplay}
            </div>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="flex items-center gap-3">
          {isWalletConnected ? (
            <div className="text-right pixel-border bg-background/40 p-3 rounded-none">
              <div className="text-sm text-muted-foreground pixel-font">Connected</div>
              <div className="text-sm font-mono pixel-font text-primary">
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </div>
            </div>
          ) : (
            <Button 
              onClick={onConnectWallet}
              className="pixel-button bg-primary hover:bg-primary/80 text-primary-foreground border-primary"
            >
              <Wallet className="w-4 h-4 mr-2 pixel-art" />
              <span className="pixel-font">Connect Wallet</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
