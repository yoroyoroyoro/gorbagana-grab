
import { Button } from '@/components/ui/button';
import { User, Trophy, Clock, Wallet, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavigationPillsProps {
  isConnected: boolean;
  publicKey: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

const NavigationPills = ({ isConnected, publicKey, onConnect, onDisconnect }: NavigationPillsProps) => {
  return (
    <div className="absolute top-6 right-6 z-20">
      <div className="flex gap-3">
        <Button asChild variant="outline" className="pixel-pill">
          <Link to="/stats">
            <User className="w-4 h-4 mr-2" />
            STATS
          </Link>
        </Button>
        <Button asChild variant="outline" className="pixel-pill">
          <Link to="/leaderboard">
            <Trophy className="w-4 h-4 mr-2" />
            SCORES
          </Link>
        </Button>
        <Button asChild variant="outline" className="pixel-pill">
          <Link to="/recent">
            <Clock className="w-4 h-4 mr-2" />
            RECENT
          </Link>
        </Button>
        {!isConnected ? (
          <Button 
            onClick={onConnect}
            variant="outline" 
            className="pixel-pill text-teal-400 border-teal-400/40 hover:bg-teal-400/10"
          >
            <Wallet className="w-4 h-4 mr-2" />
            CONNECT
          </Button>
        ) : (
          <Button 
            onClick={onDisconnect}
            variant="outline" 
            className="pixel-pill text-red-400 border-red-400/40 hover:bg-red-400/10"
          >
            <Wallet className="w-4 h-4 mr-2" />
            {publicKey!.slice(0, 4)}...{publicKey!.slice(-4)}
            <LogOut className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default NavigationPills;
