
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
    <div className="w-full retro-card pixel-border pixel-bevel p-6 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Prize Pool */}
        <div className="flex items-center gap-4 pixel-border pixel-bevel retro-card p-4">
          <Trophy className="w-8 h-8 text-accent pixel-art" />
          <div>
            <div className="pixel-font text-muted-foreground mb-1">PRIZE POOL</div>
            <div className="pixel-font-lg text-accent neon-text">
              {prizePool.toFixed(2)} GOR
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-4 pixel-border pixel-bevel retro-card p-4">
          <Timer className="w-8 h-8 text-primary pixel-art" />
          <div className="text-center">
            <div className="pixel-font text-muted-foreground mb-1">ROUND ENDS IN</div>
            <div className="pixel-font-lg text-primary neon-text">
              {timeDisplay}
            </div>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="flex items-center gap-4">
          {isWalletConnected ? (
            <div className="text-right pixel-border pixel-bevel retro-card p-4">
              <div className="pixel-font text-muted-foreground mb-1">CONNECTED</div>
              <div className="pixel-font text-primary">
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </div>
            </div>
          ) : (
            <Button 
              onClick={onConnectWallet}
              className="pixel-button border-primary text-primary-foreground"
            >
              <Wallet className="w-4 h-4 mr-2 pixel-art" />
              <span className="pixel-font">CONNECT WALLET</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
