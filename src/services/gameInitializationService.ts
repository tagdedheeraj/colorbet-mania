
import { supabase } from '@/integrations/supabase/client';
import { GameService } from './gameService';
import { GameRealtimeService } from './gameRealtimeService';

export class GameInitializationService {
  static async createDemoGameIfNeeded(): Promise<void> {
    try {
      // Check if there are any active games
      const { data: activeGames, error } = await supabase
        .from('games')
        .select('id')
        .eq('status', 'active')
        .limit(1);

      if (error) {
        console.error('Error checking for active games:', error);
        return;
      }

      // If no active games, create one
      if (!activeGames || activeGames.length === 0) {
        console.log('No active games found, creating demo game...');
        
        const gameNumber = Math.floor(Math.random() * 10000) + 1000;
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 60000); // 60 seconds from now

        const { error: createError } = await supabase
          .from('games')
          .insert({
            game_number: gameNumber,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: 'active',
            game_mode: 'quick'
          });

        if (createError) {
          console.error('Error creating demo game:', createError);
        } else {
          console.log('Demo game created successfully');
        }
      }
    } catch (error) {
      console.error('Error in createDemoGameIfNeeded:', error);
    }
  }

  static async loadInitialData() {
    const activeGame = await GameService.loadActiveGame();
    const gameHistory = await GameService.loadGameHistory();
    
    return { activeGame, gameHistory };
  }

  static setupRealtimeSubscriptions(
    onGameUpdate: () => void,
    onBetUpdate: () => void
  ) {
    const realtimeService = GameRealtimeService.getInstance();
    
    realtimeService.setupGameSubscription(() => {
      console.log('Game update received, refreshing data...');
      onGameUpdate();
    });

    realtimeService.setupBetSubscription(() => {
      console.log('Bet update received, refreshing bets...');
      onBetUpdate();
    });
  }
}
