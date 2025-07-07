
import { GameTimerService } from '@/services/gameTimerService';
import { GameInitializationService } from '@/services/gameInitializationService';
import { BetHistoryService } from '@/services/betHistoryService';
import { useGameState } from './gameState';
import { useGameOperations } from './gameOperations';
import { toast } from 'sonner';

export const useGameTimer = () => {
  const gameOps = useGameOperations();

  const startGameTimer = () => {
    const gameState = useGameState.getState();
    const currentGame = gameState.currentGame;
    
    console.log('Starting game timer for:', currentGame?.game_number);
    
    if (!currentGame) {
      console.log('No current game to start timer for');
      return;
    }

    // Clear any existing timers
    GameTimerService.clearAllTimers();

    GameTimerService.startGameTimer(
      currentGame,
      (timeRemaining, isAcceptingBets) => {
        console.log('Timer update - Time:', timeRemaining, 'Accepting bets:', isAcceptingBets);
        useGameState.getState().setTimeRemaining(timeRemaining);
        useGameState.getState().setIsAcceptingBets(isAcceptingBets);
      },
      async () => {
        console.log('Game completed callback triggered');
        
        try {
          // Get the latest completed game
          const completedGame = await BetHistoryService.getLatestCompletedGame();
          
          if (completedGame) {
            const formattedCompletedGame = {
              id: completedGame.id,
              game_number: completedGame.game_number, // Fixed: use game_number consistently
              result_color: completedGame.result_color,
              result_number: completedGame.result_number,
              start_time: completedGame.start_time,
              end_time: completedGame.end_time,
              status: completedGame.status || 'completed',
              game_mode: 'quick',
              created_at: completedGame.created_at || new Date().toISOString()
            };

            // Show result popup
            useGameState.getState().setLastCompletedGame(formattedCompletedGame);
            useGameState.getState().setShowResultPopup(true);
            
            toast.success(`Game ${formattedCompletedGame.game_number} completed! Result: ${formattedCompletedGame.result_color} ${formattedCompletedGame.result_number}`);
          }
          
          // Reload current data to get new game
          setTimeout(async () => {
            await gameOps.loadCurrentData();
            
            // Start timer for new game
            setTimeout(() => {
              console.log('Starting timer for new game');
              startGameTimer();
            }, 1000);
          }, 3000);
          
        } catch (error) {
          console.error('Error in game completion callback:', error);
        }
      }
    );
  };

  const closeResultPopup = () => {
    useGameState.getState().setShowResultPopup(false);
    useGameState.getState().setLastCompletedGame(null);
  };

  return {
    startGameTimer,
    closeResultPopup
  };
};
