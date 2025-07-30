
import { GameCreationService } from './gameCreationService';

export class GameTimerService {
  private static timers: Map<string, NodeJS.Timeout> = new Map();
  private static gameCompletionCallbacks: Map<string, () => void> = new Map();

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

    const updateTimer = () => {
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
        console.log('⏰ Timer ended for game:', currentGame.game_number);
        this.completeGameAndCreateNext(currentGame);
      }
    };

    // Start the timer immediately
    updateTimer();
  }

  private static async completeGameAndCreateNext(currentGame: any) {
    try {
      console.log('🏁 Completing game and creating next...', currentGame.game_number);
      
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
  }

  static clearAllTimers() {
    console.log('🧹 Clearing all timers');
    this.timers.forEach((timerId) => clearTimeout(timerId));
    this.timers.clear();
    this.gameCompletionCallbacks.clear();
  }
}
