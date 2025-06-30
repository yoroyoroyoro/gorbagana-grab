
interface GameStatsProps {
  prizePool: number;
  timeRemaining: string;
  gorBalance: number;
  isConnected: boolean;
}

const GameStats = ({ prizePool, timeRemaining, gorBalance, isConnected }: GameStatsProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 lg:gap-12 mb-6">
      <div className="clean-card text-center min-w-0 flex-1 sm:flex-none">
        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-teal-300 pixel-font truncate">{prizePool.toFixed(2)} SOL</div>
        <div className="text-xs sm:text-sm text-teal-500 pixel-font">PRIZE POOL</div>
      </div>
      
      <div className="clean-card text-center min-w-0 flex-1 sm:flex-none">
        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-300 pixel-font">{timeRemaining}</div>
        <div className="text-xs sm:text-sm text-emerald-500 pixel-font">TIME LEFT</div>
      </div>
      
      {isConnected && (
        <div className="clean-card text-center min-w-0 flex-1 sm:flex-none">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-cyan-300 pixel-font truncate">{gorBalance.toFixed(4)} SOL</div>
          <div className="text-xs sm:text-sm text-cyan-500 pixel-font">BALANCE</div>
        </div>
      )}
    </div>
  );
};

export default GameStats;
