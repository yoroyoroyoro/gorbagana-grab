
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface HelpModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const HelpModal = ({ isOpen, onOpenChange }: HelpModalProps) => {
  return (
    <div className="fixed bottom-8 right-8 z-30">
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <div className="relative cursor-pointer group">
            <div className="w-32 h-32 hover:scale-110 transition-transform duration-200 cursor-pointer">
              <img 
                src="/lovable-uploads/c69d84c3-2b69-430f-948c-8780de3594a6.png" 
                alt="Help Character" 
                className="w-full h-full pixel-art hover:brightness-125 transition-all duration-200"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(32, 178, 170, 0.8)) drop-shadow(0 0 40px rgba(32, 178, 170, 0.4)) drop-shadow(0 0 60px rgba(32, 178, 170, 0.2))',
                }}
              />
            </div>
          </div>
        </DialogTrigger>
        
        <DialogContent className="max-w-lg bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-800/95 border-teal-400/40 text-slate-100 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="pixel-font text-2xl text-teal-300 text-center mb-4">
              ROUND SYSTEM GUIDE
            </DialogTitle>
          </DialogHeader>
          
          <div className="pixel-font text-sm space-y-6 mt-6">
            <div className="p-4 bg-teal-900/30 rounded-lg border border-teal-400/30">
              <h3 className="text-teal-300 font-bold mb-2">Perfect Hit Jackpot</h3>
              <p className="text-slate-300">Score exactly 100 points to instantly win the entire prize pool!</p>
            </div>
            
            <div className="p-4 bg-emerald-900/30 rounded-lg border border-emerald-400/30">
              <h3 className="text-emerald-300 font-bold mb-2">24-Hour Rounds</h3>
              <p className="text-slate-300">Each round lasts exactly 24 hours. Make every game count!</p>
            </div>
            
            <div className="p-4 bg-cyan-900/30 rounded-lg border border-cyan-400/30">
              <h3 className="text-cyan-300 font-bold mb-2">Highest Score Wins</h3>
              <p className="text-slate-300">If no jackpot is hit, the player with the highest score wins the prize pool.</p>
            </div>
            
            <div className="p-4 bg-yellow-900/30 rounded-lg border border-yellow-400/30">
              <h3 className="text-yellow-300 font-bold mb-2">Tiebreaker Rule</h3>
              <p className="text-slate-300">When scores are tied, the first player to achieve that score wins!</p>
            </div>
            
            <div className="p-4 bg-pink-900/30 rounded-lg border border-pink-400/30">
              <h3 className="text-pink-300 font-bold mb-2">Entry Fee</h3>
              <p className="text-slate-300">Each game costs 0.05 GOR, which adds directly to the growing prize pool.</p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-teal-400/30 text-center">
              <div className="text-teal-300 pixel-font text-lg font-bold">
                Pay → Play → Win Big!
              </div>
              <div className="text-slate-400 pixel-font text-xs mt-2">
                Time your tap perfectly to hit the trash can
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HelpModal;
