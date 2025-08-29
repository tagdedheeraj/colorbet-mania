
import { supabase } from '@/integrations/supabase/client';
import { BetWithGame } from '@/types/supabaseGame';

export class BetHistoryService {
  static async loadAllUserBets(userId: string): Promise<BetWithGame[]> {
    try {
      console.log('📊 Loading all user bets for user:', userId);
      
      // First get all user bets with optimized query
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (betsError) {
        console.error('❌ Error loading user bets:', betsError);
        return [];
      }

      if (!bets || bets.length === 0) {
        console.log('ℹ️ No bets found for user');
        return [];
      }

      console.log('✅ Loaded', bets.length, 'bets for user');

      // Get unique period numbers from bets
      const periodNumbers = [...new Set(bets.map(bet => bet.period_number).filter(Boolean))];
      
      if (periodNumbers.length === 0) {
        console.log('ℹ️ No period numbers found in bets');
        return [];
      }
      
      // Fetch game period data for those period numbers
      const { data: gamePeriods, error: gamePeriodsError } = await supabase
        .from('game_periods')
        .select('*')
        .in('period_number', periodNumbers)
        .order('created_at', { ascending: false });

      if (gamePeriodsError) {
        console.error('❌ Error loading game periods:', gamePeriodsError);
        return [];
      }

      console.log('✅ Loaded', gamePeriods?.length || 0, 'game periods');

      // Create a map of game periods for quick lookup
      const gamePeriodsMap = (gamePeriods || []).reduce((acc, gamePeriod) => {
        acc[gamePeriod.period_number] = gamePeriod;
        return acc;
      }, {} as any);

      // Combine bets with their corresponding game period data
      const combinedData = bets.map(bet => ({
        id: bet.id,
        user_id: bet.user_id || '',
        period_number: bet.period_number,
        bet_type: bet.bet_type as 'color' | 'number',
        bet_value: bet.bet_value,
        amount: bet.amount,
        profit: bet.profit || 0,
        status: bet.status || 'pending',
        created_at: bet.created_at || new Date().toISOString(),
        game_period: {
          id: gamePeriodsMap[bet.period_number]?.id || '',
          period_number: bet.period_number,
          result_color: gamePeriodsMap[bet.period_number]?.result_color || null,
          result_number: gamePeriodsMap[bet.period_number]?.result_number || null,
          start_time: gamePeriodsMap[bet.period_number]?.start_time || '',
          end_time: gamePeriodsMap[bet.period_number]?.end_time || '',
          status: gamePeriodsMap[bet.period_number]?.status || '',
          game_mode_type: gamePeriodsMap[bet.period_number]?.game_mode_type || 'automatic',
          created_at: gamePeriodsMap[bet.period_number]?.created_at || '',
          admin_set_result_number: gamePeriodsMap[bet.period_number]?.admin_set_result_number || null,
          admin_set_result_color: gamePeriodsMap[bet.period_number]?.admin_set_result_color || null,
          is_result_locked: gamePeriodsMap[bet.period_number]?.is_result_locked || false
        }
      }));

      console.log('✅ Combined bet and game period data successfully');
      return combinedData;
    } catch (error) {
      console.error('❌ Error loading all user bets:', error);
      return [];
    }
  }

  static async getLatestCompletedGame() {
    try {
      console.log('🎯 Loading latest completed game...');
      
      const { data, error } = await supabase
        .from('game_periods')
        .select('*')
        .eq('status', 'completed')
        .not('result_number', 'is', null)
        .not('result_color', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Error loading latest completed game:', error);
        return null;
      }

      if (data) {
        console.log('✅ Latest completed game loaded:', data.period_number);
      } else {
        console.log('ℹ️ No completed games found');
      }

      return data;
    } catch (error) {
      console.error('❌ Error loading latest completed game:', error);
      return null;
    }
  }

  // New method to get recent bet activity for a user
  static async getRecentBetActivity(userId: string, limit: number = 5): Promise<BetWithGame[]> {
    try {
      console.log('📈 Loading recent bet activity for user:', userId);
      
      const allBets = await this.loadAllUserBets(userId);
      const recentBets = allBets
        .filter(bet => bet.game_period.status === 'completed')
        .slice(0, limit);
      
      console.log('✅ Recent bet activity loaded:', recentBets.length, 'bets');
      return recentBets;
    } catch (error) {
      console.error('❌ Error loading recent bet activity:', error);
      return [];
    }
  }
}
