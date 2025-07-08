
import { supabase } from '@/integrations/supabase/client';
import { BetWithGame } from '@/types/supabaseGame';

export class BetHistoryService {
  static async loadAllUserBets(userId: string): Promise<BetWithGame[]> {
    try {
      console.log('Loading bets for user:', userId);
      
      // Validate user session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('No valid session:', sessionError);
        return [];
      }

      // First get all user bets with better error handling
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (betsError) {
        console.error('Error loading user bets:', betsError);
        return [];
      }

      if (!bets || bets.length === 0) {
        console.log('No bets found for user');
        return [];
      }

      console.log('Found bets:', bets.length);

      // Get unique game IDs from bets, filtering out null values
      const gameIds = [...new Set(bets.map(bet => bet.game_id).filter(id => id !== null && id !== undefined))];
      
      if (gameIds.length === 0) {
        console.log('No valid game IDs found');
        return [];
      }

      // Fetch game data for those game IDs
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .in('id', gameIds);

      if (gamesError) {
        console.error('Error loading games:', gamesError);
        // Return bets without game data rather than empty array
        return bets.map(bet => ({
          ...bet,
          id: bet.id || '',
          game_id: bet.game_id || '',
          user_id: bet.user_id || '',
          bet_type: bet.bet_type as 'color' | 'number',
          bet_value: bet.bet_value || '',
          amount: bet.amount || 0,
          potential_win: bet.potential_win || 0,
          is_winner: bet.is_winner || false,
          actual_win: bet.actual_win || 0,
          created_at: bet.created_at || new Date().toISOString(),
          game: {
            id: bet.game_id || '',
            game_number: 0,
            result_color: null,
            result_number: null,
            start_time: '',
            end_time: '',
            status: 'unknown',
            game_mode: 'classic',
            created_at: bet.created_at || new Date().toISOString()
          }
        }));
      }

      // Create a map of games for quick lookup
      const gamesMap = (games || []).reduce((acc, game) => {
        if (game && game.id) {
          acc[game.id] = game;
        }
        return acc;
      }, {} as any);

      // Combine bets with their corresponding game data, filtering out invalid entries
      const validBets = bets
        .filter(bet => bet && bet.id && bet.game_id)
        .map(bet => ({
          id: bet.id,
          game_id: bet.game_id,
          user_id: bet.user_id || '',
          bet_type: bet.bet_type as 'color' | 'number',
          bet_value: bet.bet_value || '',
          amount: bet.amount || 0,
          potential_win: bet.potential_win || 0,
          is_winner: bet.is_winner || false,
          actual_win: bet.actual_win || 0,
          created_at: bet.created_at || new Date().toISOString(),
          game: {
            id: bet.game_id,
            game_number: gamesMap[bet.game_id]?.game_number || 0,
            result_color: gamesMap[bet.game_id]?.result_color || null,
            result_number: gamesMap[bet.game_id]?.result_number || null,
            start_time: gamesMap[bet.game_id]?.start_time || '',
            end_time: gamesMap[bet.game_id]?.end_time || '',
            status: gamesMap[bet.game_id]?.status || 'unknown',
            game_mode: gamesMap[bet.game_id]?.game_mode || 'classic',
            created_at: gamesMap[bet.game_id]?.created_at || bet.created_at || new Date().toISOString()
          }
        }));

      console.log('Processed valid bets:', validBets.length);
      return validBets;
    } catch (error) {
      console.error('Error loading all user bets:', error);
      return [];
    }
  }

  static async getLatestCompletedGame() {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading latest completed game:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error loading latest completed game:', error);
      return null;
    }
  }
}
