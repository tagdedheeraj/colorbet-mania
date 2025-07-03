
import { supabase } from '@/integrations/supabase/client';
import { BetWithGame } from '@/types/supabaseGame';

export class BetHistoryService {
  static async loadAllUserBets(userId: string): Promise<BetWithGame[]> {
    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          games!inner(
            id,
            game_number,
            result_color,
            result_number,
            status,
            created_at,
            start_time,
            end_time,
            game_mode
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading all user bets:', error);
        return [];
      }
      
      return (data || []).map(bet => ({
        id: bet.id,
        game_id: bet.game_id || '',
        user_id: bet.user_id || '',
        bet_type: bet.bet_type,
        bet_value: bet.bet_value,
        amount: bet.amount,
        potential_win: bet.potential_win,
        is_winner: bet.is_winner,
        actual_win: bet.actual_win,
        created_at: bet.created_at || new Date().toISOString(),
        game: bet.games
      }));
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
