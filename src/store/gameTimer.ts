
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
    
    if (!currentGame) {
      console.log('No current game to start timer for');
      return;
    }

    const gameMode = currentGame.game_mode || gameState.currentGameMode;
    console.log('Starting game timer for game:', currentGame.game_number, 'mode:', gameMode);

    // Clear any existing timers first
    GameTimerService.clearAllTimers();

    GameTimerService.startGameTimer(
      currentGame,
      gameMode,
      (timeRemaining, isAcceptingBets) => {
        console.log('Timer update - Time:', timeRemaining, 'Accepting bets:', isAcceptingBets);
        useGameState.getState().setTimeRemaining(timeRemaining);
        useGameState.getState().setIsAcceptingBets(isAcceptingBets);
      },
      async () => {
        console.log('Game timer ended, processing game completion...');
        
        const currentGameState = useGameState.getState();
        const gameToComplete = currentGameState.currentGame;
        
        if (!gameToComplete) {
          console.log('No game to complete');
          return;
        }

        try {
          // Complete the current game
          console.log('Completing game:', gameToComplete.game_number);
          const completed = await GameInitializationService.completeExpiredGame(gameToComplete.id);
          
          if (completed) {
            console.log('Game completed successfully, processing results...');
            
            // Wait for completion to process then get results
            setTimeout(async () => {
              try {
                // Get the completed game details
                const completedGame = await BetHistoryService.getLatestCompletedGame();
                
                if (completedGame) {
                  // Show result popup
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

                  useGameState.getState().setLastCompletedGame(formattedCompletedGame);
                  useGameState.getState().setShowResultPopup(true);
                  
                  toast.success(`Game ${formattedCompletedGame.game_number} completed! Result: ${formattedCompletedGame.result_color} ${formattedCompletedGame.result_number}`);
                  console.log('Game completion result shown:', formattedCompletedGame.game_number);
                }
                
                // Create new game after showing results
                console.log('Creating new game...');
                const newGame = await GameInitializationService.createDemoGameIfNeeded(currentGameState.currentGameMode);
                
                if (newGame) {
                  // Format and set the new game
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
                  
                  useGameState.getState().setCurrentGame(formattedNewGame);
                  console.log('New game created and set:', formattedNewGame.game_number);
                  
                  // Reload data and start timer for new game
                  await gameOps.loadCurrentData();
                  
                  setTimeout(() => {
                    console.log('Starting timer for new game');
                    startGameTimer();
                  }, 2000);
                  
                } else {
                  console.error('Failed to create new game');
                  toast.error('Failed to create new game');
                }
              } catch (error) {
                console.error('Error in post-completion processing:', error);
                toast.error('Error processing game completion');
              }
            }, 2000);
          } else {
            console.error('Failed to complete game');
            toast.error('Failed to complete game');
          }
        } catch (error) {
          console.error('Error in game completion process:', error);
          toast.error('Error in game completion');
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
