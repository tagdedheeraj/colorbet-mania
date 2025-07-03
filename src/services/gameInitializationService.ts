
import { supabase } from '@/integrations/supabase/client';
import { GameService } from './gameService';
import { GameRealtimeService } from './gameRealtimeService';

export class GameInitializationService {
  static async createDemoGameIfNeeded(): Promise<void> {
    try {
      console.log('Checking for active games...');
      
      const { data: activeGames, error } = await supabase
        .from('games')
        .select('id, end_time, status, game_number')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking for active games:', error);
        return;
      }

      let needsNewGame = true;
      if (activeGames && activeGames.length > 0) {
        const activeGame = activeGames[0];
        const timeRemaining = GameService.calculateTimeRemaining(activeGame.end_time);
        console.log('Active game time remaining:', timeRemaining, 'for game:', activeGame.game_number);
        
        if (timeRemaining > 0) {
          needsNewGame = false;
        } else {
          // Mark expired game as completed
          await supabase
            .from('games')
            .update({ status: 'completed' })
            .eq('id', activeGame.id);
          console.log('Marked expired game as completed:', activeGame.game_number);
        }
      }

      if (needsNewGame) {
        console.log('Creating new demo game...');
        
        const gameNumber = Math.floor(Math.random() * 10000) + 1000;
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 60000); // 60 seconds

        const { data: newGame, error: createError } = await supabase
          .from('games')
          .insert({
            game_number: gameNumber,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: 'active',
            game_mode: 'quick'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating demo game:', createError);
        } else {
          console.log('Demo game created successfully:', gameNumber);
        }
      }
    } catch (error) {
      console.error('Error in createDemoGameIfNeeded:', error);
    }
  }

  static async loadInitialData() {
    try {
      console.log('Loading initial game data...');
      const activeGame = await GameService.loadActiveGame();
      const gameHistory = await GameService.loadGameHistory();
      
      console.log('Initial data loaded:', {
        activeGame: activeGame ? `Game #${activeGame.game_number}` : 'None',
        historyCount: gameHistory.length
      });
      
      return { activeGame, gameHistory };
    } catch (error) {
      console.error('Error loading initial data:', error);
      return { activeGame: null, gameHistory: [] };
    }
  }

  static setupRealtimeSubscriptions(
    onGameUpdate: () => void,
    onBetUpdate: () => void
  ) {
    try {
      const realtimeService = GameRealtimeService.getInstance();
      
      realtimeService.setupGameSubscription(() => {
        console.log('Game update received, refreshing data...');
        onGameUpdate();
      });

      realtimeService.setupBetSubscription(() => {
        console.log('Bet update received, refreshing bets...');
        onBetUpdate();
      });
    } catch (error) {
      console.error('Error setting up realtime subscriptions:', error);
    }
  }
}
