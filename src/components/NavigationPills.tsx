
import { Button } from '@/components/ui/button';
import { User, Wallet, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavigationPillsProps {
  isConnected: boolean;
  publicKey: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

const NavigationPills = ({ isConnected, publicKey, onConnect, onDisconnect }: NavigationPillsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
      <Button asChild variant="outline" className="pixel-pill text-xs sm:text-sm">
        <Link to="/stats">
          <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">STATS</span>
          <span className="sm:hidden">S</span>
        </Link>
      </Button>
      {!isConnected ? (
        <Button 
          onClick={onConnect}
          variant="outline" 
          className="pixel-pill text-teal-400 border-teal-400/40 hover:bg-teal-400/10 text-xs sm:text-sm"
        >
          <Wallet className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">CONNECT</span>
          <span className="sm:hidden">CONN</span>
        </Button>
      ) : (
        <Button 
          onClick={onDisconnect}
          variant="outline" 
          className="pixel-pill text-red-400 border-red-400/40 hover:bg-red-400/10 text-xs sm:text-sm"
        >
          <Wallet className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">{publicKey!.slice(0, 4)}...{publicKey!.slice(-4)}</span>
          <span className="sm:hidden">{publicKey!.slice(0, 2)}...</span>
          <LogOut className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
        </Button>
      )}
    </div>
  );
};

export default NavigationPills;
