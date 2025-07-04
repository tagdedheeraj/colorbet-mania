
import { supabase } from '@/integrations/supabase/client';
import { BetWithGame } from '@/types/supabaseGame';

export class BetHistoryService {
  static async loadAllUserBets(userId: string): Promise<BetWithGame[]> {
    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          game_periods!inner(
            id,
            period_number,
            result_color,
            result_number,
            status,
            created_at,
            start_time,
            end_time
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
        game_id: bet.period_number?.toString() || '',
        user_id: bet.user_id || '',
        bet_type: bet.bet_type as 'color' | 'number',
        bet_value: bet.bet_value,
        amount: bet.amount,
        potential_win: bet.amount * 2, // Simple calculation since potential_win doesn't exist
        is_winner: bet.profit ? bet.profit > 0 : false,
        actual_win: bet.profit || 0,
        created_at: bet.created_at || new Date().toISOString(),
        game: {
          id: bet.game_periods?.id || '',
          game_number: bet.game_periods?.period_number || 0,
          result_color: bet.game_periods?.result_color || null,
          result_number: bet.game_periods?.result_number || null,
          start_time: bet.game_periods?.start_time || '',
          end_time: bet.game_periods?.end_time || '',
          status: bet.game_periods?.status || '',
          game_mode: 'classic', // Default since game_mode doesn't exist
          created_at: bet.game_periods?.created_at || ''
        }
      }));
    } catch (error) {
      console.error('Error loading all user bets:', error);
      return [];
    }
  }

  static async getLatestCompletedGame() {
    try {
      const { data, error } = await supabase
        .from('game_periods')
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
