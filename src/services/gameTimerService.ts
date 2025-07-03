
import { GameService } from './gameService';

export class GameTimerService {
  private static timers: Map<string, NodeJS.Timeout> = new Map();

  static startGameTimer(
    currentGame: any,
    currentGameMode: string,
    onTimerUpdate: (timeRemaining: number, isAcceptingBets: boolean) => void,
    onGameEnd: () => void
  ) {
    if (!currentGame) return;

    // Clear existing timer if any
    this.clearTimer(currentGame.id);

    const updateTimer = () => {
      const timeRemaining = GameService.calculateTimeRemaining(currentGame.end_time);
      const isAcceptingBets = GameService.isAcceptingBets(timeRemaining, currentGameMode, currentGame.status);
      
      console.log('Timer update:', {
        gameId: currentGame.id,
        gameNumber: currentGame.game_number,
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
        // Game ended
        console.log('Game ended, clearing timer and triggering onGameEnd');
        this.clearTimer(currentGame.id);
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
    }
  }

  static clearAllTimers() {
    this.timers.forEach((timerId) => clearTimeout(timerId));
    this.timers.clear();
  }
}
