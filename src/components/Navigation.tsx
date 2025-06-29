
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
    <nav className="flex flex-wrap items-center justify-between gap-2 mb-6 p-4 bg-card/80 backdrop-blur-sm pixel-border">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm" className="pixel-button border-primary">
          <Link to="/stats">
            <User className="w-4 h-4 mr-2 pixel-art" />
            <span className="hidden sm:inline pixel-font">Player Stats</span>
            <span className="sm:hidden pixel-font">Stats</span>
          </Link>
        </Button>
        
        <Button asChild variant="outline" size="sm" className="pixel-button border-accent">
          <Link to="/leaderboard">
            <Trophy className="w-4 h-4 mr-2 pixel-art" />
            <span className="hidden sm:inline pixel-font">Leaderboard</span>
            <span className="sm:hidden pixel-font">Leaders</span>
          </Link>
        </Button>
        
        <Button asChild variant="outline" size="sm" className="pixel-button border-secondary">
          <Link to="/recent">
            <Clock className="w-4 h-4 mr-2 pixel-art" />
            <span className="hidden sm:inline pixel-font">Recent Games</span>
            <span className="sm:hidden pixel-font">Recent</span>
          </Link>
        </Button>
      </div>
      
      {isConnected && (
        <Button 
          onClick={handleDisconnect}
          variant="outline"
          size="sm"
          className="pixel-button text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
        >
          <LogOut className="w-4 h-4 mr-2 pixel-art" />
          <span className="hidden sm:inline pixel-font">Disconnect</span>
        </Button>
      )}
    </nav>
  );
};

export default Navigation;
