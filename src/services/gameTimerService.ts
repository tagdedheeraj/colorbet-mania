
import { GameCreationService } from './gameCreationService';

export class GameTimerService {
  private static timers: Map<string, NodeJS.Timeout> = new Map();
  private static gameCompletionCallbacks: Map<string, () => void> = new Map();

  static startGameTimer(
    currentGame: any,
    onTimerUpdate: (timeRemaining: number, isAcceptingBets: boolean) => void,
    onGameComplete: () => void
  ) {
    if (!currentGame) {
      console.log('No game provided to start timer');
      return;
    }

    console.log('Starting timer for game:', currentGame.period_number || currentGame.game_number);

    // Clear existing timer
    this.clearTimer(currentGame.id);
    
    // Store completion callback
    this.gameCompletionCallbacks.set(currentGame.id, onGameComplete);

    const updateTimer = () => {
      if (!currentGame.end_time) {
        console.warn('Game end_time is null, setting default');
        const now = new Date();
        currentGame.end_time = new Date(now.getTime() + 60000).toISOString();
      }

      const now = new Date().getTime();
      const endTime = new Date(currentGame.end_time).getTime();
      const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
      const isAcceptingBets = timeRemaining > 5; // Stop accepting bets 5 seconds before end

      console.log('Timer update:', {
        gameId: currentGame.id,
        periodNumber: currentGame.period_number || currentGame.game_number,
        timeRemaining,
        isAcceptingBets
      });

      onTimerUpdate(timeRemaining, isAcceptingBets);

      if (timeRemaining > 0) {
        const timerId = setTimeout(updateTimer, 1000);
        this.timers.set(currentGame.id, timerId);
      } else {
        console.log('Game timer ended, completing game...');
        this.completeGameAndCreateNext(currentGame);
      }
    };

    updateTimer();
  }

  private static async completeGameAndCreateNext(currentGame: any) {
    try {
      console.log('Completing game and creating next...');
      
      // Complete current game
      const completed = await GameCreationService.completeGame(currentGame.id);
      
      if (completed) {
        // Trigger completion callback
        const callback = this.gameCompletionCallbacks.get(currentGame.id);
        if (callback) {
          callback();
        }

        // Wait a moment then create new game
        setTimeout(async () => {
          const newGame = await GameCreationService.createNewGame('quick');
          if (newGame) {
            console.log('New game created:', newGame.period_number);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error in game completion flow:', error);
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
      console.log('Timer cleared for game:', gameId);
    }
  }

  static clearAllTimers() {
    console.log('Clearing all timers');
    this.timers.forEach((timerId) => clearTimeout(timerId));
    this.timers.clear();
    this.gameCompletionCallbacks.clear();
  }
}
