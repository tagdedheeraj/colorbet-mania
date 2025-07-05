
import { GameService } from './gameService';

export class GameTimerService {
  private static timers: Map<string, NodeJS.Timeout> = new Map();

  static startGameTimer(
    currentGame: any,
    gameMode: string,
    onTimerUpdate: (timeRemaining: number, isAcceptingBets: boolean) => void,
    onGameEnd: () => void
  ) {
    if (!currentGame) return;

    // Clear existing timer if any
    this.clearTimer(currentGame.id);

    const updateTimer = () => {
      // Handle case where end_time might be null
      if (!currentGame.end_time) {
        console.warn('Game end_time is null, setting default timer');
        const now = new Date();
        const defaultEndTime = new Date(now.getTime() + 60000);
        currentGame.end_time = defaultEndTime.toISOString();
      }

      const timeRemaining = GameService.calculateTimeRemaining(currentGame.end_time);
      const isAcceptingBets = GameService.isAcceptingBets(timeRemaining, gameMode, currentGame.status);
      
      console.log('Timer update:', {
        gameId: currentGame.id,
        gameNumber: currentGame.game_number || currentGame.period_number,
        gameMode: gameMode,
        timeRemaining,
        isAcceptingBets,
        status: currentGame.status,
        endTime: currentGame.end_time
      });
      
      onTimerUpdate(timeRemaining, isAcceptingBets);

      if (timeRemaining > 0) {
        const timerId = setTimeout(updateTimer, 1000);
        this.timers.set(currentGame.id, timerId);
      } else {
        // Game ended - ensure completion happens
        console.log('Game ended, clearing timer and triggering completion');
        this.clearTimer(currentGame.id);
        
        // Call the game completion handler
        onGameEnd();
      }
    };

    updateTimer();
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
  }
}
