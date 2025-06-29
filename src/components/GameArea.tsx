
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
    if (score === 100) return 'text-teal-300';
    if (score >= 90) return 'text-cyan-300';
    if (score >= 70) return 'text-emerald-300';
    if (score >= 50) return 'text-yellow-300';
    return 'text-red-300';
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Game Container */}
      <div className="game-container mb-8">
        {/* Game Bar */}
        <div className="relative h-24 mb-6 bg-gradient-to-r from-teal-900/70 via-emerald-900/70 to-cyan-900/70 border-2 border-teal-400/40 overflow-hidden">
          {/* Jackpot Zone */}
          <div 
            className="absolute top-4 h-16 jackpot-zone flex items-center justify-center"
            style={{ 
              left: '45%', 
              width: '10%'
            }}
          >
            <span className="pixel-font text-teal-200 neon-text text-xs">
              ZERO
            </span>
          </div>

          {/* Moving Pixel Character Cursor */}
          {isPlaying && (
            <div 
              className="absolute top-1 w-8 h-8 transition-none z-20 flex items-center justify-center"
              style={{ 
                left: `calc(${cursorPosition}% - 16px)`, // Center the character
                filter: 'drop-shadow(0 0 10px rgba(32, 178, 170, 0.8))'
              }}
            >
              <img 
                src="/lovable-uploads/ba2e939e-10ea-4a3f-84ad-76e3dc1d28e7.png" 
                alt="Game Cursor" 
                className="w-full h-full pixel-art"
              />
            </div>
          )}

          {/* Score Display */}
          {gameScore !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-30">
              <div className="text-center clean-card">
                <div className={`text-4xl font-bold ${getScoreColor(gameScore)} pixel-font-xl mb-2`}>
                  {gameScore}
                </div>
                {gameScore === 100 && (
                  <div className="text-teal-300 pixel-font neon-text">
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
              className={canPlay ? "pixel-button-primary" : "pixel-pill opacity-50"}
            >
              {canPlay ? 'PAY 0.05 GOR & PLAY' : 'CONNECT WALLET'}
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold py-4 px-8 pixel-font border-2 border-red-400/60"
            >
              STOP AT ZERO!
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center">
          <p className="pixel-font text-teal-400 text-xs">
            TIME YOUR TAP TO HIT THE ZERO ZONE
          </p>
          <p className="pixel-font text-teal-500 text-xs mt-2">
            PERFECT SCORE = INSTANT JACKPOT
          </p>
        </div>
      </div>
    </div>
  );
};

export default GameArea;
