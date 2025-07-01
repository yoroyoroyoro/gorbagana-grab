
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface HelpModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const HelpModal = ({ isOpen, onOpenChange }: HelpModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900 border-teal-400/40">
        <DialogHeader>
          <DialogTitle className="pixel-font text-teal-400 text-xl">How to Play Gorbagana Grab</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 text-slate-300 pixel-font text-sm">
          {/* Game Basics */}
          <section>
            <h3 className="text-teal-400 font-bold mb-2">🎮 GAME BASICS</h3>
            <ul className="space-y-1 text-xs">
              <li>• Connect your Backpack wallet to play</li>
              <li>• Each game costs 0.05 GOR to play</li>
              <li>• Time your tap to hit the moving trash can target</li>
              <li>• Score is based on accuracy (0-100 points)</li>
            </ul>
          </section>

          {/* Scoring System */}
          <section>
            <h3 className="text-teal-400 font-bold mb-2">🎯 SCORING SYSTEM</h3>
            <ul className="space-y-1 text-xs">
              <li>• <span className="text-red-300">0-49 points:</span> Keep trying!</li>
              <li>• <span className="text-yellow-300">50-69 points:</span> Good attempt</li>
              <li>• <span className="text-emerald-300">70-89 points:</span> Great shot!</li>
              <li>• <span className="text-cyan-300">90-99 points:</span> Excellent!</li>
              <li>• <span className="text-teal-300">100 points:</span> INSTANT JACKPOT! 🎰</li>
            </ul>
          </section>

          {/* Prize System */}
          <section>
            <h3 className="text-teal-400 font-bold mb-2">💰 PRIZE SYSTEM</h3>
            <ul className="space-y-1 text-xs">
              <li>• All game payments go into a shared prize pool</li>
              <li>• <span className="text-teal-300">Perfect Score (100):</span> Win the ENTIRE prize pool instantly!</li>
              <li>• <span className="text-yellow-300">Round End:</span> Highest scorer wins the remaining pool</li>
              <li>• <span className="text-orange-300">Tiebreaker:</span> If multiple players have the same highest score, the FIRST person to achieve that score wins</li>
            </ul>
          </section>

          {/* Round System */}
          <section>
            <h3 className="text-yellow-400 font-bold mb-2">⏰ ROUND SYSTEM</h3>
            <div className="bg-yellow-900/20 border border-yellow-400/30 p-3 rounded">
              <ul className="space-y-1 text-xs">
                <li>• <span className="text-yellow-300">24-hour rounds:</span> Each round lasts exactly 24 hours</li>
                <li>• <span className="text-yellow-300">Auto restart:</span> Rounds automatically restart when time expires</li>
                <li>• <span className="text-yellow-300">Prize pool reset:</span> Prize pool resets to 0 GOR when a new round starts</li>
                <li>• <span className="text-yellow-300">Fresh start:</span> Every player gets a clean slate each round</li>
                <li>• <span className="text-yellow-300">Winner takes all:</span> Round winner gets the entire accumulated prize pool</li>
                <li>• <span className="text-orange-300">Timing matters:</span> Being first to achieve the highest score gives you the advantage!</li>
              </ul>
            </div>
          </section>

          {/* Jackpot Rules */}
          <section>
            <h3 className="text-teal-400 font-bold mb-2">🎰 JACKPOT RULES</h3>
            <ul className="space-y-1 text-xs">
              <li>• Perfect score (100 points) = INSTANT JACKPOT</li>
              <li>• Jackpot winner gets ALL prize pool funds immediately</li>
              <li>• Round restarts immediately after jackpot</li>
              <li>• Prize pool resets to 0 GOR after jackpot payout</li>
            </ul>
          </section>

          {/* Strategy Tips */}
          <section>
            <h3 className="text-emerald-400 font-bold mb-2">💡 STRATEGY TIPS</h3>
            <ul className="space-y-1 text-xs">
              <li>• Watch the cursor movement pattern carefully</li>
              <li>• The live score shows your potential points</li>
              <li>• Aim for the center of the trash can for maximum points</li>
              <li>• Early round = smaller prize pool, late round = bigger prizes</li>
              <li>• Perfect timing beats speed - focus on accuracy!</li>
              <li>• <span className="text-orange-300">Play early if you're confident:</span> Being first to hit a high score secures your win!</li>
            </ul>
          </section>

          {/* Technical Info */}
          <section>
            <h3 className="text-slate-400 font-bold mb-2">🔧 TECHNICAL INFO</h3>
            <ul className="space-y-1 text-xs">
              <li>• Built on GOR RPC network</li>
              <li>• Payments processed via Backpack wallet</li>
              <li>• Prize distribution is automatic</li>
              <li>• All transactions are verifiable on-chain</li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpModal;
