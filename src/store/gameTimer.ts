
import { GameTimerService } from '@/services/gameTimerService';
import { GameInitializationService } from '@/services/gameInitializationService';
import { BetHistoryService } from '@/services/betHistoryService';
import { useGameState } from './gameState';
import { useGameOperations } from './gameOperations';
import { toast } from 'sonner';

export const useGameTimer = () => {
  const {
    currentGame,
    currentGameMode,
    setTimeRemaining,
    setIsAcceptingBets,
    setLastCompletedGame,
    setShowResultPopup,
    setCurrentGame
  } = useGameState();

  const gameOps = useGameOperations();

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
            console.log('Completing game:', gameToComplete.game_number);
            await GameInitializationService.completeExpiredGame(gameToComplete.id);
            
            // Wait for the completion to process
            setTimeout(async () => {
              try {
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
                    game_mode: 'quick',
                    created_at: completedGame.created_at || new Date().toISOString()
                  };

                  setLastCompletedGame(formattedCompletedGame);
                  setShowResultPopup(true);
                  
                  // Show result toast
                  toast.success(`Game ${formattedCompletedGame.game_number} completed! Result: ${formattedCompletedGame.result_color} ${formattedCompletedGame.result_number}`);
                }
                
                // Create new game after a short delay
                console.log('Creating new game...');
                const newGame = await GameInitializationService.createDemoGameIfNeeded(useGameState.getState().currentGameMode);
                
                if (newGame) {
                  // Format the new game
                  const formattedNewGame = {
                    id: newGame.id,
                    game_number: newGame.period_number,
                    result_color: newGame.result_color,
                    result_number: newGame.result_number,
                    start_time: newGame.start_time,
                    end_time: newGame.end_time,
                    status: newGame.status || 'active',
                    game_mode: 'quick',
                    created_at: newGame.created_at || new Date().toISOString()
                  };
                  
                  setCurrentGame(formattedNewGame);
                  console.log('New game created:', formattedNewGame.game_number);
                  
                  // Start timer for the new game
                  setTimeout(() => {
                    startGameTimer();
                  }, 1000);
                  
                  // Reload game data
                  await gameOps.loadCurrentData();
                }
              } catch (error) {
                console.error('Error in post-completion processing:', error);
              }
            }, 2000);
            
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
