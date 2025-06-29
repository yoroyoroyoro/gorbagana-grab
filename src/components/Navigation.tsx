
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart3, Trophy, Clock, User, LogOut } from 'lucide-react';
import { useBackpackWallet } from '@/hooks/useBackpackWallet';

const Navigation = () => {
  const { isConnected, disconnect } = useBackpackWallet();

  const handleDisconnect = async () => {
    await disconnect();
  };

  return (
    <nav className="flex flex-wrap items-center justify-between gap-2 mb-6 p-4 bg-card/50 border border-border rounded-lg">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/stats">
            <User className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Player Stats</span>
            <span className="sm:hidden">Stats</span>
          </Link>
        </Button>
        
        <Button asChild variant="outline" size="sm">
          <Link to="/leaderboard">
            <Trophy className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Leaderboard</span>
            <span className="sm:hidden">Leaders</span>
          </Link>
        </Button>
        
        <Button asChild variant="outline" size="sm">
          <Link to="/recent">
            <Clock className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Recent Games</span>
            <span className="sm:hidden">Recent</span>
          </Link>
        </Button>
      </div>
      
      {isConnected && (
        <Button 
          onClick={handleDisconnect}
          variant="outline"
          size="sm"
          className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Disconnect</span>
        </Button>
      )}
    </nav>
  );
};

export default Navigation;
