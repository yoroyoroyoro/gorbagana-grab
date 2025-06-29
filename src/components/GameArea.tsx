
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
      {/* Game Bar Container */}
      <div 
        ref={gameAreaRef}
        className="relative h-24 bg-card border border-border rounded-lg overflow-hidden game-glow mb-6"
      >
        {/* Jackpot Zone (center 10%) */}
        <div 
          className="absolute top-0 h-full bg-accent/20 border-x-2 border-accent jackpot-glow"
          style={{ 
            left: '45%', 
            width: '10%'
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-accent neon-text">JACKPOT</span>
          </div>
        </div>

        {/* Cursor */}
        {isPlaying && (
          <div 
            className="absolute top-0 w-1 h-full bg-primary shadow-lg transition-none"
            style={{ 
              left: `${cursorPosition}%`,
              boxShadow: '0 0 20px hsl(var(--primary))'
            }}
          />
        )}

        {/* Score Display */}
        {gameScore !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(gameScore)} neon-text`}>
                {gameScore}
              </div>
              {gameScore === 100 && (
                <div className="text-accent text-lg font-bold animate-pulse">
                  INSTANT JACKPOT!
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
            className="bg-primary hover:bg-primary/80 text-primary-foreground text-xl px-8 py-4 pulse-glow"
          >
            {canPlay ? 'Pay 0.05 GOR & Play' : 'Connect Wallet to Play'}
          </Button>
        ) : (
          <Button
            onClick={handleStop}
            className="bg-accent hover:bg-accent/80 text-accent-foreground text-xl px-8 py-4 pulse-glow"
          >
            STOP!
          </Button>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-muted-foreground">
        <p>Time your tap to land in the golden jackpot zone for maximum points!</p>
        <p className="text-sm mt-1">Perfect score (100) wins the entire prize pool instantly!</p>
      </div>
    </div>
  );
};

export default GameArea;
