
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
}
