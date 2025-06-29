
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
    if (score === 100) return 'text-green-400';
    if (score >= 90) return 'text-cyan-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Clean Game Container */}
      <div className="game-container mb-8">
        {/* Game Bar - Simplified */}
        <div className="relative h-24 mb-6 bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-blue-900/50 border-2 border-white/20 overflow-hidden">
          {/* Jackpot Zone - Clean design */}
          <div 
            className="absolute top-4 h-16 jackpot-zone flex items-center justify-center"
            style={{ 
              left: '45%', 
              width: '10%'
            }}
          >
            <span className="pixel-font text-green-400 neon-text text-xs">
              ZERO
            </span>
          </div>

          {/* Moving Cursor - Clean design */}
          {isPlaying && (
            <div 
              className="absolute top-0 w-1 h-full bg-white shadow-lg transition-none z-20"
              style={{ 
                left: `${cursorPosition}%`,
                boxShadow: '0 0 15px rgba(255, 255, 255, 0.8)'
              }}
            />
          )}

          {/* Score Display - Clean overlay */}
          {gameScore !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
              <div className="text-center clean-card">
                <div className={`text-4xl font-bold ${getScoreColor(gameScore)} pixel-font-xl mb-2`}>
                  {gameScore}
                </div>
                {gameScore === 100 && (
                  <div className="text-green-400 pixel-font neon-text">
                    JACKPOT!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Game Controls - Clean buttons */}
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
              className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-bold py-4 px-8 pixel-font border-2 border-white/30"
            >
              STOP AT ZERO!
            </Button>
          )}
        </div>

        {/* Simple Instructions */}
        <div className="mt-6 text-center">
          <p className="pixel-font text-gray-400 text-xs">
            TIME YOUR TAP TO HIT THE ZERO ZONE
          </p>
          <p className="pixel-font text-gray-500 text-xs mt-2">
            PERFECT SCORE = INSTANT JACKPOT
          </p>
        </div>
      </div>
    </div>
  );
};

export default GameArea;
