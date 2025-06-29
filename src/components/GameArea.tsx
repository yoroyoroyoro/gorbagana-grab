
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
    if (score === 100) return 'text-accent';
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      {/* Game Bar Container with Pixelated Styling */}
      <div 
        ref={gameAreaRef}
        className="relative h-32 bg-card/90 backdrop-blur-sm pixel-border game-glow mb-6 overflow-hidden"
        style={{
          backgroundImage: `url('/lovable-uploads/58d1aeda-ee90-40d9-9e97-2b52f4024eae.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          imageRendering: 'pixelated'
        }}
      >
        {/* Dark overlay for better visibility */}
        <div className="absolute inset-0 bg-background/60" />
        
        {/* Jackpot Zone (center 10%) */}
        <div 
          className="absolute top-0 h-full bg-accent/30 backdrop-blur-sm jackpot-glow z-10"
          style={{ 
            left: '45%', 
            width: '10%',
            borderLeft: '3px solid hsl(var(--accent))',
            borderRight: '3px solid hsl(var(--accent))'
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-accent neon-text pixel-font pixel-flicker">
              JACKPOT
            </span>
          </div>
        </div>

        {/* Cursor */}
        {isPlaying && (
          <div 
            className="absolute top-0 w-2 h-full bg-primary z-20 pixel-border transition-none"
            style={{ 
              left: `${cursorPosition}%`,
              boxShadow: '0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--primary))',
              borderColor: 'hsl(var(--primary))'
            }}
          />
        )}

        {/* Score Display */}
        {gameScore !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-30">
            <div className="text-center pixel-border bg-card/90 p-6">
              <div className={`text-4xl font-bold ${getScoreColor(gameScore)} neon-text pixel-font mb-2`}>
                {gameScore}
              </div>
              {gameScore === 100 && (
                <div className="text-accent text-lg font-bold pixel-font pixel-flicker">
                  JACKPOT!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Game Controls */}
      <div className="text-center">
        {!isPlaying ? (
          <Button
            onClick={onStartGame}
            disabled={!canPlay}
            className="pixel-button bg-primary hover:bg-primary/80 text-primary-foreground text-xl px-8 py-4 pulse-glow border-primary"
          >
            {canPlay ? 'Pay 0.05 GOR & Play' : 'Connect Wallet'}
          </Button>
        ) : (
          <Button
            onClick={handleStop}
            className="pixel-button bg-accent hover:bg-accent/80 text-accent-foreground text-xl px-8 py-4 pulse-glow border-accent"
          >
            STOP!
          </Button>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-muted-foreground">
        <p className="pixel-font text-sm">Time your tap to land in the golden jackpot zone!</p>
        <p className="text-xs mt-1 pixel-font">Perfect score (100) wins the entire prize pool instantly!</p>
      </div>
    </div>
  );
};

export default GameArea;
