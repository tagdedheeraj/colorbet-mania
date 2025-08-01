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
    // Enhanced betting window - allow betting until 3 seconds before end
    const initialIsAcceptingBets = initialTimeRemaining > 3;

    console.log('⏰ Initial timer state:', {
      gameNumber: currentGame.game_number,
      timeRemaining: initialTimeRemaining,
      isAcceptingBets: initialIsAcceptingBets,
      endTime: currentGame.end_time,
      bettingWindowEndsAt: `${initialTimeRemaining - 3}s`
    });

    // Set initial state immediately - this ensures countdown is visible
    gameState.setTimeRemaining(initialTimeRemaining);
    gameState.setIsAcceptingBets(initialIsAcceptingBets);

    // If game is already over, complete it immediately
    if (initialTimeRemaining === 0) {
      console.log('🏁 Game already over, completing...');
      handleGameCompletion();
      return;
    }

    // Start the timer with enhanced callback handling
    GameTimerService.startGameTimer(
      currentGame,
      (timeRemaining, isAcceptingBets) => {
        const currentState = useGameState.getState();
        
        console.log('⏱️ Timer update callback:', {
          gameNumber: currentGame.game_number,
          timeRemaining,
          isAcceptingBets,
          bettingStatus: isAcceptingBets ? 'OPEN' : 'CLOSED',
          isBettingInProgress: currentState.isBettingInProgress
        });
        
        // Only update timer state if not currently placing a bet
        // This prevents timer reset during bet placement
        if (!currentState.isBettingInProgress) {
          // Always update time remaining to maintain countdown visibility
          currentState.setTimeRemaining(timeRemaining);
          
          // Update betting status based on timer logic
          currentState.setIsAcceptingBets(isAcceptingBets);
        } else {
          // During bet placement, only update time remaining
          // Keep betting status as it was to prevent UI lockup
          console.log('🔒 Bet in progress - preserving betting state');
          currentState.setTimeRemaining(timeRemaining);
        }
        
        // Provide user feedback when betting window closes
        if (!isAcceptingBets && timeRemaining > 0 && timeRemaining <= 3) {
          console.log('🔒 Betting window closed, awaiting result...');
        }
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

        console.log('🎉 Game result ready:', {
          gameNumber: formattedCompletedGame.game_number,
          resultColor: formattedCompletedGame.result_color,
          resultNumber: formattedCompletedGame.result_number
        });

        // Show result popup
        useGameState.getState().setLastCompletedGame(formattedCompletedGame);
        useGameState.getState().setShowResultPopup(true);
        
        toast.success(`Game ${formattedCompletedGame.game_number} completed! Result: ${formattedCompletedGame.result_color} ${formattedCompletedGame.result_number}`);
      }
      
      // Reload current data to get new game with proper delay
      setTimeout(async () => {
        console.log('🔄 Loading new game data...');
        await gameOps.loadCurrentData();
        
        // Start timer for new game after ensuring state is loaded
        setTimeout(() => {
          console.log('🔄 Starting timer for new game');
          startGameTimer();
        }, 2000);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error in game completion callback:', error);
      // Even on error, try to reload after delay
      setTimeout(async () => {
        await gameOps.loadCurrentData();
        setTimeout(() => startGameTimer(), 2000);
      }, 5000);
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
