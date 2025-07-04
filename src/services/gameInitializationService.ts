
import { supabase } from '@/integrations/supabase/client';

export class GameInitializationService {
  static async initializeGame() {
    try {
      console.log('Initializing game...');
      
      // Check for active games in game_periods table
      const { data: activeGames, error: activeError } = await supabase
        .from('game_periods')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (activeError) {
        console.error('Error checking active games:', activeError);
        return null;
      }

      // If there's an active game, check if it's expired
      if (activeGames && activeGames.length > 0) {
        const activeGame = activeGames[0];
        const now = new Date();
        const endTime = new Date(activeGame.end_time || now);
        
        if (endTime > now) {
          console.log('Found active game:', activeGame.period_number, 'ending at:', endTime);
          return {
            id: activeGame.id,
            period_number: activeGame.period_number,
            end_time: activeGame.end_time,
            status: activeGame.status,
            created_at: activeGame.created_at
          };
        }
      }

      console.log('No active game found, would need to create one');
      return null;
    } catch (error) {
      console.error('Game initialization error:', error);
      return null;
    }
  }

  static async getCurrentGame() {
    try {
      const { data: games, error } = await supabase
        .from('game_periods')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching current game:', error);
        return null;
      }

      return games;
    } catch (error) {
      console.error('Error getting current game:', error);
      return null;
    }
  }

  static async cleanupOldGames() {
    try {
      console.log('Cleaning up old games...');
      return true;
    } catch (error) {
      console.error('Error cleaning up old games:', error);
      return false;
    }
  }

  static async createDemoGameIfNeeded(gameMode: string = 'quick') {
    try {
      console.log('Creating demo game if needed for mode:', gameMode);
      
      // Check if there's already an active game
      const activeGame = await this.getCurrentGame();
      if (activeGame) {
        console.log('Active game already exists');
        return activeGame;
      }

      // Get the next period number
      const { data: lastGame } = await supabase
        .from('game_periods')
        .select('period_number')
        .order('period_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextPeriodNumber = (lastGame?.period_number || 0) + 1;
      const now = new Date();
      const endTime = new Date(now.getTime() + 60000); // 60 seconds from now

      const { data: newGame, error } = await supabase
        .from('game_periods')
        .insert({
          period_number: nextPeriodNumber,
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          status: 'active',
          game_mode_type: 'automatic' // Default to automatic mode
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating demo game:', error);
        return null;
      }

      console.log('Created new demo game:', newGame);
      return newGame;
    } catch (error) {
      console.error('Error in createDemoGameIfNeeded:', error);
      return null;
    }
  }

  static async setupRealtimeSubscriptions(onGameUpdate: () => void, onBetUpdate: () => void) {
    try {
      console.log('Setting up realtime subscriptions...');
      
      // Subscribe to game_periods changes
      const gameChannel = supabase
        .channel('game_periods_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'game_periods'
        }, () => {
          console.log('Game periods changed');
          onGameUpdate();
        })
        .subscribe();

      // Subscribe to bets changes
      const betChannel = supabase
        .channel('bets_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'bets'
        }, () => {
          console.log('Bets changed');
          onBetUpdate();
        })
        .subscribe();

      return { gameChannel, betChannel };
    } catch (error) {
      console.error('Error setting up realtime subscriptions:', error);
      return null;
    }
  }

  static async loadInitialData() {
    try {
      console.log('Loading initial game data...');
      
      // Load active game
      const activeGame = await this.getCurrentGame();
      
      // Load game history
      const { data: gameHistory, error: historyError } = await supabase
        .from('game_periods')
        .select('*')
        .eq('status', 'completed')
        .order('period_number', { ascending: false })
        .limit(10);

      if (historyError) {
        console.error('Error loading game history:', historyError);
      }

      return {
        activeGame,
        gameHistory: gameHistory || []
      };
    } catch (error) {
      console.error('Error loading initial data:', error);
      return {
        activeGame: null,
        gameHistory: []
      };
    }
  }

  static async completeExpiredGame(gameId: string) {
    try {
      console.log('Completing expired game:', gameId);
      
      // Get the current game to check if it has manual results set
      const { data: currentGame } = await supabase
        .from('game_periods')
        .select('*')
        .eq('id', gameId)
        .single();

      if (!currentGame) {
        console.error('Game not found');
        return false;
      }

      let resultColor: string;
      let resultNumber: number;

      // Check if admin has set manual results
      if (currentGame.game_mode_type === 'manual' && 
          currentGame.admin_set_result_color && 
          currentGame.admin_set_result_number !== null) {
        // Use admin set results
        resultColor = currentGame.admin_set_result_color;
        resultNumber = currentGame.admin_set_result_number;
        console.log('Using admin set results:', resultColor, resultNumber);
      } else {
        // Generate random result for automatic mode
        const colors = ['red', 'green', 'purple-red'];
        const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        resultColor = colors[Math.floor(Math.random() * colors.length)];
        resultNumber = numbers[Math.floor(Math.random() * numbers.length)];
        console.log('Using random results:', resultColor, resultNumber);
      }

      const { error } = await supabase
        .from('game_periods')
        .update({
          status: 'completed',
          result_color: resultColor,
          result_number: resultNumber
        })
        .eq('id', gameId);

      if (error) {
        console.error('Error completing game:', error);
        return false;
      }

      console.log('Game completed with result:', resultColor, resultNumber);
      return true;
    } catch (error) {
      console.error('Error in completeExpiredGame:', error);
      return false;
    }
  }
}
