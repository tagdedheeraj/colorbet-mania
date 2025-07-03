
import { useEffect, useState } from 'react';
import useSupabaseGameStore from '@/store/supabaseGameStore';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from "sonner";

interface ResultState {
  show: boolean;
  isWin: boolean;
  amount: number;
  message: string;
  bets: any[];
  gameNumber: number;
}

const ResultPopup = () => {
  const { currentBets, gameHistory } = useSupabaseGameStore();
  const { user } = useSupabaseAuthStore();
  const isMobile = useIsMobile();
  const [resultState, setResultState] = useState<ResultState>({
    show: false,
    isWin: false,
    amount: 0,
    message: '',
    bets: [],
    gameNumber: 0
  });
  const [processedGames, setProcessedGames] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !gameHistory.length) return;

    console.log('ResultPopup: Checking for completed games...', {
      userExists: !!user,
      gameHistoryLength: gameHistory.length,
      currentBetsLength: currentBets.length
    });

    // Check for newly completed games with results
    const completedGamesWithResults = gameHistory.filter(game => 
      game.status === 'completed' && 
      game.result_color && 
      game.result_number !== null &&
      !processedGames.has(game.id)
    );

    console.log('Found completed games with results:', completedGamesWithResults.length);

    if (completedGamesWithResults.length > 0) {
      const latestGame = completedGamesWithResults[0];
      console.log('Processing latest completed game:', latestGame.game_number);
      
      // Find user bets for this specific game
      const gameBets = currentBets.filter(bet => bet.game_id === latestGame.id);
      console.log('User bets for this game:', gameBets.length);
      
      if (gameBets.length > 0) {
        const winningBets = gameBets.filter(bet => bet.is_winner === true);
        const totalWinAmount = winningBets.reduce((sum, bet) => sum + (bet.actual_win || 0), 0);
        const totalBetAmount = gameBets.reduce((sum, bet) => sum + bet.amount, 0);
        
        console.log('Bet results:', {
          totalBets: gameBets.length,
          winningBets: winningBets.length,
          totalWinAmount,
          totalBetAmount
        });
        
        if (winningBets.length > 0) {
          // User won
          setResultState({
            show: true,
            isWin: true,
            amount: totalWinAmount,
            message: `Congratulations! You won ${totalWinAmount.toFixed(2)} coins!`,
            bets: winningBets,
            gameNumber: latestGame.game_number
          });
          
          toast.success(`🎉 You won ${totalWinAmount.toFixed(2)} coins!`, {
            description: `${winningBets.length} winning bet${winningBets.length > 1 ? 's' : ''} on Game #${latestGame.game_number}`,
            duration: 5000,
          });
        } else {
          // User lost
          setResultState({
            show: true,
            isWin: false,
            amount: totalBetAmount,
            message: `You lost ${totalBetAmount.toFixed(2)} coins. Better luck next time!`,
            bets: gameBets,
            gameNumber: latestGame.game_number
          });
          
          toast.error(`😔 You lost ${totalBetAmount.toFixed(2)} coins`, {
            description: `No winning bets on Game #${latestGame.game_number}`,
            duration: 4000,
          });
        }
        
        // Mark this game as processed
        setProcessedGames(prev => new Set(prev).add(latestGame.id));
        
        // Hide popup after 5 seconds
        setTimeout(() => {
          setResultState(prev => ({ ...prev, show: false }));
        }, 5000);
      } else {
        console.log('No bets found for completed game, marking as processed');
        // Mark as processed even if no bets to avoid repeated checks
        setProcessedGames(prev => new Set(prev).add(latestGame.id));
      }
    }
  }, [gameHistory, currentBets, user, processedGames]);

  const handleClose = () => {
    setResultState(prev => ({ ...prev, show: false }));
  };

  return (
    <AnimatePresence>
      {resultState.show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={`bg-white rounded-xl p-6 max-w-md w-full mx-4 ${
              resultState.isWin ? 'border-2 border-green-500' : 'border-2 border-red-500'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className={`text-6xl mb-4 ${resultState.isWin ? 'text-green-500' : 'text-red-500'}`}>
                {resultState.isWin ? '🎉' : '😔'}
              </div>
              
              <h2 className={`text-2xl font-bold mb-2 ${
                resultState.isWin ? 'text-green-600' : 'text-red-600'
              }`}>
                {resultState.isWin ? 'You Won!' : 'You Lost!'}
              </h2>
              
              <p className="text-gray-700 mb-2">{resultState.message}</p>
              <p className="text-sm text-gray-500 mb-4">Game #{resultState.gameNumber}</p>
              
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-2">Your Bets:</h3>
                {resultState.bets.map((bet, index) => (
                  <div key={bet.id} className="flex justify-between items-center py-1">
                    <span className="text-sm">
                      {bet.bet_type === 'color' ? 
                        `Color: ${bet.bet_value}` : 
                        `Number: ${bet.bet_value}`
                      }
                    </span>
                    <span className={`text-sm font-medium ${
                      bet.is_winner ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {bet.is_winner ? `+${bet.actual_win}` : `-${bet.amount}`}
                    </span>
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleClose}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResultPopup;
