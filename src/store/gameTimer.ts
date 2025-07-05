
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
    if (!currentGame) {
      console.log('No current game to start timer for');
      return;
    }

    const gameMode = currentGame.game_mode || currentGameMode;
    console.log('Starting game timer for game:', currentGame.game_number, 'mode:', gameMode);

    // Clear any existing timers first
    GameTimerService.clearAllTimers();

    GameTimerService.startGameTimer(
      currentGame,
      gameMode,
      (timeRemaining, isAcceptingBets) => {
        console.log('Timer update - Time:', timeRemaining, 'Accepting bets:', isAcceptingBets);
        setTimeRemaining(timeRemaining);
        setIsAcceptingBets(isAcceptingBets);
      },
      async () => {
        console.log('Game timer ended, processing game completion...');
        
        const gameToComplete = useGameState.getState().currentGame;
        if (!gameToComplete) {
          console.log('No game to complete');
          return;
        }

        try {
          // Complete the current game
          console.log('Completing game:', gameToComplete.game_number);
          const completed = await GameInitializationService.completeExpiredGame(gameToComplete.id);
          
          if (completed) {
            // Wait for completion to process
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
                  
                  console.log('Game completion result shown:', formattedCompletedGame.game_number);
                }
                
                // Create new game after showing results
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
                  console.log('New game created and set:', formattedNewGame.game_number);
                  
                  // Start timer for the new game
                  setTimeout(() => {
                    console.log('Starting timer for new game');
                    startGameTimer();
                  }, 1000);
                  
                  // Reload game data
                  await gameOps.loadCurrentData();
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
    setShowResultPopup(false);
    setLastCompletedGame(null);
  };

  return {
    startGameTimer,
    closeResultPopup
  };
};
