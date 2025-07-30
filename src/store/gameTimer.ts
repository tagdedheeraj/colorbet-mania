
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
    
    console.log('🎮 Starting game timer for game:', currentGame?.game_number);
    
    if (!currentGame) {
      console.log('❌ No current game to start timer for');
      return;
    }

    // Clear any existing timers first
    GameTimerService.clearAllTimers();

    // Calculate initial time remaining and betting status
    const now = new Date().getTime();
    const endTime = new Date(currentGame.end_time).getTime();
    const initialTimeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
    const initialIsAcceptingBets = initialTimeRemaining > 5;

    console.log('⏰ Initial timer state:', {
      gameNumber: currentGame.game_number,
      timeRemaining: initialTimeRemaining,
      isAcceptingBets: initialIsAcceptingBets,
      endTime: currentGame.end_time
    });

    // Set initial state immediately
    gameState.setTimeRemaining(initialTimeRemaining);
    gameState.setIsAcceptingBets(initialIsAcceptingBets);

    // If game is already over, complete it immediately
    if (initialTimeRemaining === 0) {
      console.log('🏁 Game already over, completing...');
      handleGameCompletion();
      return;
    }

    // Start the timer
    GameTimerService.startGameTimer(
      currentGame,
      (timeRemaining, isAcceptingBets) => {
        console.log('⏱️ Timer update:', {
          gameNumber: currentGame.game_number,
          timeRemaining,
          isAcceptingBets
        });
        gameState.setTimeRemaining(timeRemaining);
        gameState.setIsAcceptingBets(isAcceptingBets);
      },
      handleGameCompletion
    );
  };

  const handleGameCompletion = async () => {
    console.log('🎯 Game completed callback triggered');
    
    try {
      // Get the latest completed game
      const completedGame = await BetHistoryService.getLatestCompletedGame();
      
      if (completedGame) {
        const formattedCompletedGame = {
          id: completedGame.id,
          game_number: completedGame.game_number,
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
        
        // Start timer for new game after a short delay
        setTimeout(() => {
          console.log('🔄 Starting timer for new game');
          startGameTimer();
        }, 2000);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error in game completion callback:', error);
    }
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
