
interface GameStatsProps {
  prizePool: number;
  timeRemaining: string;
  gorBalance: number;
  isConnected: boolean;
}

const GameStats = ({ prizePool, timeRemaining, gorBalance, isConnected }: GameStatsProps) => {
  return (
    <div className="flex justify-center gap-12 mb-6">
      <div className="clean-card text-center">
        <div className="text-2xl font-bold text-teal-300 pixel-font">{prizePool.toFixed(2)} GOR</div>
        <div className="text-sm text-teal-500 pixel-font">PRIZE POOL</div>
      </div>
      
      <div className="clean-card text-center">
        <div className="text-2xl font-bold text-emerald-300 pixel-font">{timeRemaining}</div>
        <div className="text-sm text-emerald-500 pixel-font">TIME LEFT</div>
      </div>
      
      {isConnected && (
        <div className="clean-card text-center">
          <div className="text-2xl font-bold text-cyan-300 pixel-font">{gorBalance.toFixed(2)} GOR</div>
          <div className="text-sm text-cyan-500 pixel-font">BALANCE</div>
        </div>
      )}
    </div>
  );
};

export default GameStats;
