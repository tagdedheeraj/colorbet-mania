
import { supabase } from '@/integrations/supabase/client';
import { GameCreationService } from './gameCreationService';
import { toast } from 'sonner';

export class GameInitializationService {
  static async loadInitialData() {
    console.log('Loading initial game data...');
    
    try {
      // Load active game
      const { data: activeGame, error: activeError } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeError) {
        console.error('Error loading active game:', activeError);
      }

      // If no active game, create one
      if (!activeGame) {
        console.log('No active game found, creating new game...');
        const newGame = await GameCreationService.createNewGame('quick');
        if (newGame) {
          return {
            activeGame: newGame,
            gameHistory: []
          };
        }
      }

      // Load game history
      const { data: gameHistory, error: historyError } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'completed')
        .order('game_number', { ascending: false })
        .limit(10);

      if (historyError) {
        console.error('Error loading game history:', historyError);
      }

      console.log('Initial data loaded:', {
        activeGame: activeGame?.game_number,
        historyCount: gameHistory?.length || 0
      });

      return {
        activeGame,
        gameHistory: gameHistory || []
      };
    } catch (error) {
      console.error('Error in loadInitialData:', error);
      return {
        activeGame: null,
        gameHistory: []
      };
    }
  }

  static async ensureActiveGame(): Promise<any> {
    try {
      // Check for active game
      const { data: activeGame } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'active')
        .maybeSingle();

      if (activeGame) {
        // Check if game is expired
        const now = new Date().getTime();
        const endTime = new Date(activeGame.end_time).getTime();
        
        if (now > endTime) {
          console.log('Active game is expired, completing it...');
          await GameCreationService.completeGame(activeGame.id);
          return await GameCreationService.createNewGame('quick');
        }
        
        return activeGame;
      }

      // No active game, create one
      console.log('No active game found, creating new one...');
      return await GameCreationService.createNewGame('quick');
    } catch (error) {
      console.error('Error ensuring active game:', error);
      return null;
    }
  }

  static setupRealtimeSubscriptions(onGameUpdate: () => void, onBetUpdate: () => void) {
    try {
      console.log('Setting up realtime subscriptions...');
      
      const gameChannel = supabase
        .channel('games_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'games'
          },
          (payload) => {
            console.log('Game changed:', payload);
            onGameUpdate();
          }
        )
        .subscribe();

      const betsChannel = supabase
        .channel('bets_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bets'
          },
          (payload) => {
            console.log('Bet changed:', payload);
            onBetUpdate();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(gameChannel);
        supabase.removeChannel(betsChannel);
      };
    } catch (error) {
      console.error('Error setting up realtime subscriptions:', error);
      return () => {};
    }
  }

  static async cleanupExpiredGames(): Promise<void> {
    try {
      console.log('Cleaning up expired games...');
      
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: expiredGames } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'active')
        .lt('end_time', fiveMinutesAgo);

      if (expiredGames && expiredGames.length > 0) {
        console.log('Found expired games:', expiredGames.length);
        
        for (const game of expiredGames) {
          await GameCreationService.completeGame(game.id);
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}
