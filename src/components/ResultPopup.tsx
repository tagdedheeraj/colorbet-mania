
import { useEffect } from 'react';
import useGameStore from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from "sonner";

const ResultPopup = () => {
  const { winLossPopup, hideWinLossPopup } = useGameStore();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (winLossPopup.show) {
      // Display a toast notification when popup is shown
      if (winLossPopup.isWin) {
        toast.success(`You won ${winLossPopup.amount.toFixed(2)} coins!`, {
          description: winLossPopup.message,
          duration: 5000,
        });
      } else {
        toast.error("You lost", {
          description: winLossPopup.message,
          duration: 5000,
        });
      }
      
      const timer = setTimeout(() => {
        hideWinLossPopup();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [winLossPopup.show, hideWinLossPopup, winLossPopup.isWin, winLossPopup.amount, winLossPopup.message]);
  
  return (
    <AnimatePresence>
      {winLossPopup.show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ type: "spring", damping: 15 }}
          className="fixed bottom-16 left-0 right-0 w-full z-50 px-4 sm:px-0 sm:left-1/2 sm:bottom-6 sm:-translate-x-1/2 sm:max-w-md sm:w-full mx-auto pointer-events-none"
        >
          <div className={`glass-panel p-4 sm:p-6 rounded-xl border-2 pointer-events-auto ${
            winLossPopup.isWin 
              ? 'border-game-green bg-glow-green' 
              : 'border-game-red bg-glow-red'
          }`}>
            <div className="text-center">
              <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${
                winLossPopup.isWin 
                  ? 'text-game-green' 
                  : 'text-game-red'
              }`}>
                {winLossPopup.isWin ? 'You Won!' : 'You Lost'}
              </h3>
              <p className="text-base sm:text-lg mb-2">{winLossPopup.message}</p>
              
              {winLossPopup.isWin && (
                <div className="flex items-center justify-center gap-2 text-lg sm:text-xl font-bold text-game-gold animate-bounce-subtle">
                  +{winLossPopup.amount.toFixed(2)} coins
                </div>
              )}
              
              <button 
                className="mt-4 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={hideWinLossPopup}
              >
                Tap to dismiss
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResultPopup;
