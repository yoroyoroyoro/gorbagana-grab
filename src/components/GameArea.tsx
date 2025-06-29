
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface GameAreaProps {
  isPlaying: boolean;
  onStop: (score: number) => void;
  onStartGame: () => void;
  canPlay: boolean;
}

const GameArea = ({ isPlaying, onStop, onStartGame, canPlay }: GameAreaProps) => {
  const [cursorPosition, setCursorPosition] = useState(0);
  const [gameScore, setGameScore] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // Cursor sweep animation
  useEffect(() => {
    if (isPlaying) {
      setGameScore(null);
      const startTime = Date.now();
      
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) % 4000; // 4 second cycle
        const progress = elapsed / 4000;
        setCursorPosition(progress * 100);
      }, 16); // ~60fps
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying]);

  const handleStop = () => {
    if (!isPlaying) return;
    
    // Calculate score based on distance from center (50%)
    const distanceFromCenter = Math.abs(cursorPosition - 50);
    const score = Math.max(0, Math.round(100 - (distanceFromCenter * 2)));
    
    setGameScore(score);
    onStop(score);
  };

  const getScoreColor = (score: number) => {
    if (score === 100) return 'text-primary neon-text';
    if (score >= 90) return 'text-accent';
    if (score >= 70) return 'text-blue-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-destructive';
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      {/* Game Bar Container with 8-bit Styling */}
      <div 
        ref={gameAreaRef}
        className="relative h-32 game-area pixel-border pixel-bevel mb-6 overflow-hidden"
        style={{
          backgroundImage: `url('/lovable-uploads/58d1aeda-ee90-40d9-9e97-2b52f4024eae.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          imageRendering: 'pixelated'
        }}
      >
        {/* Pixel dither overlay for better visibility */}
        <div className="absolute inset-0 pixel-dither opacity-70" />
        
        {/* Jackpot Zone (center 10%) with scan lines and sparkles */}
        <div 
          className="absolute top-4 h-24 jackpot-zone z-10"
          style={{ 
            left: '45%', 
            width: '10%'
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="pixel-font text-primary neon-text">
              JACKPOT
            </span>
          </div>
        </div>

        {/* 8-bit Cursor */}
        {isPlaying && (
          <div 
            className="absolute top-0 w-3 h-full z-20 pixel-border transition-none"
            style={{ 
              left: `${cursorPosition}%`,
              background: 'linear-gradient(180deg, hsl(var(--pixel-aqua)) 0%, hsl(var(--pixel-aqua)) 100%)',
              boxShadow: '0 0 20px hsl(var(--pixel-aqua)), 0 0 40px hsl(var(--pixel-aqua))',
              borderColor: 'hsl(var(--pixel-bright))'
            }}
          />
        )}

        {/* Score Display with 8-bit styling */}
        {gameScore !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-30">
            <div className="text-center pixel-border pixel-bevel retro-card p-8">
              <div className={`text-5xl font-bold ${getScoreColor(gameScore)} pixel-font-xl mb-4`}>
                {gameScore}
              </div>
              {gameScore === 100 && (
                <div className="text-primary pixel-font-lg neon-text">
                  JACKPOT!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Game Controls with 8-bit buttons */}
      <div className="text-center">
        {!isPlaying ? (
          <Button
            onClick={onStartGame}
            disabled={!canPlay}
            className="pixel-button border-primary text-primary-foreground pixel-font-lg px-8 py-4"
          >
            {canPlay ? 'PAY 0.05 GOR & PLAY' : 'CONNECT WALLET'}
          </Button>
        ) : (
          <Button
            onClick={handleStop}
            className="pixel-button border-accent bg-accent text-accent-foreground pixel-font-lg px-8 py-4"
          >
            STOP!
          </Button>
        )}
      </div>

      {/* Instructions with pixel styling */}
      <div className="mt-6 text-center">
        <div className="pixel-border pixel-bevel retro-card p-4">
          <p className="pixel-font text-muted-foreground mb-2">
            TIME YOUR TAP TO LAND IN THE GOLDEN JACKPOT ZONE!
          </p>
          <p className="pixel-font text-xs text-muted-foreground">
            PERFECT SCORE (100) WINS THE ENTIRE PRIZE POOL INSTANTLY!
          </p>
        </div>
      </div>
    </div>
  );
};

export default GameArea;
