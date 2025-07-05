
import { GameTimerService } from '@/services/gameTimerService';
import { GameInitializationService } from '@/services/gameInitializationService';
import { BetHistoryService } from '@/services/betHistoryService';
import { useGameState } from './gameState';
import { toast } from 'sonner';

export const useGameTimer = () => {
  const {
    currentGame,
    currentGameMode,
    setTimeRemaining,
    setIsAcceptingBets,
    setLastCompletedGame,
    setShowResultPopup
  } = useGameState();

  const startGameTimer = () => {
    if (!currentGame) return;

    const gameMode = currentGame.game_mode || currentGameMode;
    console.log('Starting game timer for game:', currentGame.game_number, 'mode:', gameMode);

    GameTimerService.startGameTimer(
      currentGame,
      gameMode,
      (timeRemaining, isAcceptingBets) => {
        setTimeRemaining(timeRemaining);
        setIsAcceptingBets(isAcceptingBets);
      },
      async () => {
        console.log('Game timer ended, completing game and showing results...');
        
        const gameToComplete = useGameState.getState().currentGame;
        if (gameToComplete) {
          try {
            // Complete the current game
            await GameInitializationService.completeExpiredGame(gameToComplete.id);
            
            // Wait for the edge function to process
            setTimeout(async () => {
              // Get the completed game details
              const completedGame = await BetHistoryService.getLatestCompletedGame();
              
              if (completedGame) {
                // Transform completedGame to match SupabaseGame format
                const formattedCompletedGame = {
                  id: completedGame.id,
                  game_number: completedGame.period_number || (completedGame as any).game_number,
                  result_color: completedGame.result_color,
                  result_number: completedGame.result_number,
                  start_time: completedGame.start_time,
                  end_time: completedGame.end_time,
                  status: completedGame.status || 'completed',
                  game_mode: 'quick', // Default since not in schema
                  created_at: completedGame.created_at || new Date().toISOString()
                };

                setLastCompletedGame(formattedCompletedGame);
                setShowResultPopup(true);
                
                // Show result toast
                toast.success(`Game ${formattedCompletedGame.game_number} completed! Result: ${formattedCompletedGame.result_color} ${formattedCompletedGame.result_number}`);
              }
              
              // Refresh all data to get the completed game and results
              // This will be handled by game operations
              
              // Create new game after a short delay
              setTimeout(async () => {
                await GameInitializationService.createDemoGameIfNeeded(useGameState.getState().currentGameMode);
                // Load data again to get the new game
                setTimeout(() => {
                  // This will be handled by game operations
                }, 1000);
              }, 2000);
            }, 1000);
            
          } catch (error) {
            console.error('Error in game completion process:', error);
          }
        }
      }
    );
  };

  const closeResultPopup = () => {
    setShowResultPopup(false);
    setLastCompletedGame(null);
  };

  return {
    startGameTimer,
    closeResultPopup
  };
};
