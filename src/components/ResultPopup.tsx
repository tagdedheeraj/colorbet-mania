
import { useEffect } from 'react';
import useGameStore from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

const ResultPopup = () => {
  const { winLossPopup, hideWinLossPopup } = useGameStore();
  
  useEffect(() => {
    if (winLossPopup.show) {
      const timer = setTimeout(() => {
        hideWinLossPopup();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [winLossPopup.show, hideWinLossPopup]);
  
  return (
    <AnimatePresence>
      {winLossPopup.show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ type: "spring", damping: 15 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4"
        >
          <div className={`glass-panel p-6 rounded-xl border-2 ${
            winLossPopup.isWin 
              ? 'border-game-green bg-glow-green' 
              : 'border-game-red bg-glow-red'
          }`}>
            <div className="text-center">
              <h3 className={`text-2xl font-bold mb-2 ${
                winLossPopup.isWin 
                  ? 'text-game-green' 
                  : 'text-game-red'
              }`}>
                {winLossPopup.isWin ? 'You Won!' : 'You Lost'}
              </h3>
              <p className="text-lg mb-2">{winLossPopup.message}</p>
              
              {winLossPopup.isWin && (
                <div className="flex items-center justify-center gap-2 text-xl font-bold text-game-gold animate-bounce-subtle">
                  +{winLossPopup.amount.toFixed(2)} coins
                </div>
              )}
              
              <button 
                className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
