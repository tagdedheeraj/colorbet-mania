
import { supabase } from '@/integrations/supabase/client';
import { BetWithGame } from '@/types/supabaseGame';

export class BetHistoryService {
  static async loadUserBetHistory(userId: string, limit: number = 50): Promise<BetWithGame[]> {
    try {
      console.log('📊 Loading bet history for user:', userId);

      // Get bets with game period data
      const { data: bets, error } = await supabase
        .from('bets')
        .select(`
          *,
          game_periods!bets_period_number_fkey(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error loading bet history:', error);
        return [];
      }

      if (!bets || bets.length === 0) {
        console.log('📊 No bet history found for user');
        return [];
      }

      // Map to BetWithGame format
      const betHistory: BetWithGame[] = bets.map(bet => ({
        id: bet.id,
        user_id: bet.user_id,
        period_number: bet.period_number,
        bet_type: bet.bet_type as 'color' | 'number',
        bet_value: bet.bet_value,
        amount: bet.amount,
        profit: bet.profit || 0,
        status: bet.status || 'pending',
        created_at: bet.created_at || new Date().toISOString(),
        game_period: {
          id: bet.game_periods?.id || '',
          period_number: bet.game_periods?.period_number || bet.period_number,
          start_time: bet.game_periods?.start_time || new Date().toISOString(),
          end_time: bet.game_periods?.end_time || null,
          status: bet.game_periods?.status || 'completed',
          result_color: bet.game_periods?.result_color || null,
          result_number: bet.game_periods?.result_number || null,
          game_mode_type: bet.game_periods?.game_mode_type || 'automatic',
          created_at: bet.game_periods?.created_at || new Date().toISOString(),
          admin_set_result_number: bet.game_periods?.admin_set_result_number || null,
          admin_set_result_color: bet.game_periods?.admin_set_result_color || null,
          is_result_locked: bet.game_periods?.is_result_locked || false
        },
        // Add required BetWithGame properties
        game_id: bet.game_periods?.id || bet.id,
        actual_win: bet.profit || 0,
        is_winner: bet.status === 'won'
      }));

      console.log('✅ Bet history loaded successfully:', betHistory.length);
      return betHistory;

    } catch (error) {
      console.error('❌ Exception in loadUserBetHistory:', error);
      return [];
    }
  }

  static async getUserGameResults(userId: string, limit: number = 10) {
    try {
      console.log('🎯 Loading game results for user:', userId);

      const { data: results, error } = await supabase
        .from('bets')
        .select(`
          *,
          game_periods!bets_period_number_fkey(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error loading game results:', error);
        return [];
      }

      // Group by period and calculate results
      const gameResults = results?.reduce((acc, bet) => {
        const period = bet.period_number;
        if (!acc[period]) {
          acc[period] = {
            period_number: period,
            result_number: bet.game_periods?.result_number,
            result_color: bet.game_periods?.result_color,
            total_bet: 0,
            total_win: 0,
            bet_count: 0,
            is_winner: false
          };
        }
        
        acc[period].total_bet += bet.amount;
        acc[period].total_win += bet.profit || 0;
        acc[period].bet_count += 1;
        
        if (bet.status === 'won') {
          acc[period].is_winner = true;
        }
        
        return acc;
      }, {} as any) || {};

      const resultArray = Object.values(gameResults);
      console.log('✅ Game results loaded:', resultArray.length);
      return resultArray;

    } catch (error) {
      console.error('❌ Exception in getUserGameResults:', error);
      return [];
    }
  }
}
