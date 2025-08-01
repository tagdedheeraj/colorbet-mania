import { GameCreationService } from './gameCreationService';
import { EnhancedManualGameService } from './admin/enhancedManualGameService';

export class GameTimerService {
  private static timers: Map<string, NodeJS.Timeout> = new Map();
  private static gameCompletionCallbacks: Map<string, () => void> = new Map();
  private static manualCheckIntervals: Map<string, NodeJS.Timeout> = new Map();

  static startGameTimer(
    currentGame: any,
    onTimerUpdate: (timeRemaining: number, isAcceptingBets: boolean) => void,
    onGameComplete: () => void
  ) {
    if (!currentGame || !currentGame.end_time) {
      console.log('❌ Invalid game data for timer:', currentGame);
      return;
    }

    console.log('🚀 Starting enhanced timer for game:', currentGame.game_number);

    // Clear existing timer for this game
    this.clearTimer(currentGame.id);
    
    // Store completion callback
    this.gameCompletionCallbacks.set(currentGame.id, onGameComplete);

    // Start manual mode monitoring
    this.startManualModeMonitoring(currentGame.id);

    const updateTimer = async () => {
      try {
        // Check if game is in manual mode before proceeding
        const gameStatus = await EnhancedManualGameService.checkGameStatus(currentGame.id);
        
        if (gameStatus.error) {
          console.error('❌ Error checking game status:', gameStatus.error);
          // Continue with normal timer in case of status check error
        }
        
        if (gameStatus.isManual && gameStatus.timerPaused) {
          console.log('⏸️ Game is in manual mode with timer paused:', currentGame.game_number);
          // Update UI to show betting closed and timer at 0
          onTimerUpdate(0, false);
          
          // Schedule next check in 5 seconds
          const timerId = setTimeout(updateTimer, 5000);
          this.timers.set(currentGame.id, timerId);
          return;
        }

        // Normal timer logic for automatic mode
        const now = new Date().getTime();
        const endTime = new Date(currentGame.end_time).getTime();
        const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
        
        // Enhanced betting window logic - allow betting until 3 seconds before end
        // This gives users more time to place bets while ensuring proper game completion
        const isAcceptingBets = timeRemaining > 3;

        console.log('⏰ Timer update:', {
          gameNumber: currentGame.game_number,
          timeRemaining,
          isAcceptingBets,
          bettingWindowClosed: timeRemaining <= 3
        });

        // Always call update callback to maintain countdown visibility
        onTimerUpdate(timeRemaining, isAcceptingBets);

        if (timeRemaining > 0) {
          // Schedule next update every second for smooth countdown
          const timerId = setTimeout(updateTimer, 1000);
          this.timers.set(currentGame.id, timerId);
        } else {
          console.log('⏰ Timer ended for game (checking manual mode):', currentGame.game_number);
          
          // Final check for manual mode before auto-completion
          const finalStatus = await EnhancedManualGameService.checkGameStatus(currentGame.id);
          
          if (finalStatus.isManual) {
            console.log('🛑 Game completion blocked - manual mode active');
            // Keep checking every 10 seconds for manual completion
            const timerId = setTimeout(updateTimer, 10000);
            this.timers.set(currentGame.id, timerId);
          } else {
            // Auto-complete the game
            this.completeGameAndCreateNext(currentGame);
          }
        }
      } catch (error) {
        console.error('❌ Error in timer update:', error);
        // Fallback to normal timer behavior
        const now = new Date().getTime();
        const endTime = new Date(currentGame.end_time).getTime();
        const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
        const isAcceptingBets = timeRemaining > 3; // Changed from 2 to 3 for better user experience
        
        onTimerUpdate(timeRemaining, isAcceptingBets);
        
        if (timeRemaining > 0) {
          const timerId = setTimeout(updateTimer, 1000);
          this.timers.set(currentGame.id, timerId);
        } else {
          this.completeGameAndCreateNext(currentGame);
        }
      }
    };

    // Start the timer immediately
    updateTimer();
  }

  private static startManualModeMonitoring(gameId: string) {
    // Clear existing manual check interval
    const existingInterval = this.manualCheckIntervals.get(gameId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Check manual mode status every 3 seconds
    const intervalId = setInterval(async () => {
      try {
        const status = await EnhancedManualGameService.checkGameStatus(gameId);
        console.log('🔍 Manual mode check for game', gameId, ':', {
          isManual: status.isManual,
          timerPaused: status.timerPaused,
          resultSet: status.resultSet
        });
      } catch (error) {
        console.error('❌ Error in manual mode monitoring:', error);
      }
    }, 3000);

    this.manualCheckIntervals.set(gameId, intervalId);
  }

  private static async completeGameAndCreateNext(currentGame: any) {
    try {
      console.log('🏁 Completing game and creating next...', currentGame.game_number);
      
      // Triple-check manual mode before completion
      const finalStatus = await EnhancedManualGameService.checkGameStatus(currentGame.id);
      if (finalStatus.isManual && finalStatus.timerPaused) {
        console.log('🛑 Game completion aborted - manual mode still active');
        return;
      }
      
      // Complete current game
      const completed = await GameCreationService.completeGame(currentGame.id);
      
      if (completed) {
        // Trigger completion callback
        const callback = this.gameCompletionCallbacks.get(currentGame.id);
        if (callback) {
          console.log('📞 Calling game completion callback');
          callback();
        }

        // Wait a moment then create new game
        setTimeout(async () => {
          const newGame = await GameCreationService.createNewGame('quick');
          if (newGame) {
            console.log('✨ New game created:', newGame.game_number);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Error in game completion flow:', error);
    } finally {
      this.clearTimer(currentGame.id);
      this.gameCompletionCallbacks.delete(currentGame.id);
    }
  }

  static clearTimer(gameId: string) {
    const timerId = this.timers.get(gameId);
    if (timerId) {
      clearTimeout(timerId);
      this.timers.delete(gameId);
      console.log('🧹 Timer cleared for game:', gameId);
    }

    // Also clear manual check interval
    const intervalId = this.manualCheckIntervals.get(gameId);
    if (intervalId) {
      clearInterval(intervalId);
      this.manualCheckIntervals.delete(gameId);
      console.log('🧹 Manual check interval cleared for game:', gameId);
    }
  }

  static clearAllTimers() {
    console.log('🧹 Clearing all timers and intervals');
    this.timers.forEach((timerId) => clearTimeout(timerId));
    this.timers.clear();
    this.gameCompletionCallbacks.clear();
    
    // Clear all manual check intervals
    this.manualCheckIntervals.forEach((intervalId) => clearInterval(intervalId));
    this.manualCheckIntervals.clear();
  }
}
