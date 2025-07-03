
import { useEffect } from 'react';
import useSupabaseGameStore from '@/store/supabaseGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from "sonner";

const ResultPopup = () => {
  const { currentBets } = useSupabaseGameStore();
  const isMobile = useIsMobile();
  
  // For now, we'll show toast notifications for bet results
  // This can be enhanced later with a proper popup system
  useEffect(() => {
    const recentWins = currentBets.filter(bet => bet.is_winner && bet.actual_win);
    if (recentWins.length > 0) {
      const totalWin = recentWins.reduce((sum, bet) => sum + (bet.actual_win || 0), 0);
      toast.success(`You won ${totalWin.toFixed(2)} coins!`, {
        description: `${recentWins.length} winning bet${recentWins.length > 1 ? 's' : ''}`,
        duration: 5000,
      });
    }
  }, [currentBets]);
  
  return null; // For now, we're using toast notifications instead of popup
};

export default ResultPopup;
