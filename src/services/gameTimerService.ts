import { GameCreationService } from './gameCreationService';
import { ManualGameService } from './admin/manualGameService';

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
      // Check if game is in manual mode before proceeding
      const isManual = await ManualGameService.checkGameManualStatus(currentGame.id);
      
      if (isManual) {
        console.log('⏸️ Game is in manual mode, timer paused for game:', currentGame.game_number);
        // Still update UI but don't auto-complete
        onTimerUpdate(0, false); // Show betting closed in manual mode
        
        // Schedule next check in 5 seconds
        const timerId = setTimeout(updateTimer, 5000);
        this.timers.set(currentGame.id, timerId);
        return;
      }

      const now = new Date().getTime();
      const endTime = new Date(currentGame.end_time).getTime();
      const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
      const isAcceptingBets = timeRemaining > 5; // Stop accepting bets 5 seconds before end

      // Call update callback
      onTimerUpdate(timeRemaining, isAcceptingBets);

      if (timeRemaining > 0) {
        // Schedule next update
        const timerId = setTimeout(updateTimer, 1000);
        this.timers.set(currentGame.id, timerId);
      } else {
        console.log('⏰ Timer ended for game (auto mode):', currentGame.game_number);
        // Only auto-complete if not in manual mode
        const finalManualCheck = await ManualGameService.checkGameManualStatus(currentGame.id);
        if (!finalManualCheck) {
          this.completeGameAndCreateNext(currentGame);
        } else {
          console.log('🛑 Game completion blocked - manual mode active');
          // Keep checking every 10 seconds for manual completion
          const timerId = setTimeout(updateTimer, 10000);
          this.timers.set(currentGame.id, timerId);
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
        const isManual = await ManualGameService.checkGameManualStatus(gameId);
        console.log('🔍 Manual mode check for game', gameId, ':', isManual);
      } catch (error) {
        console.error('❌ Error checking manual mode:', error);
      }
    }, 3000);

    this.manualCheckIntervals.set(gameId, intervalId);
  }

  private static async completeGameAndCreateNext(currentGame: any) {
    try {
      console.log('🏁 Completing game and creating next...', currentGame.game_number);
      
      // Double-check manual mode before completion
      const isManual = await ManualGameService.checkGameManualStatus(currentGame.id);
      if (isManual) {
        console.log('🛑 Game completion aborted - manual mode detected');
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
