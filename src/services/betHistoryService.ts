
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

      // Get unique game IDs from bets
      const gameIds = [...new Set(bets.map(bet => bet.game_id).filter(Boolean))];
      
      if (gameIds.length === 0) {
        console.log('ℹ️ No game IDs found in bets');
        return [];
      }
      
      // Fetch game data for those game IDs with optimized query
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .in('id', gameIds)
        .order('created_at', { ascending: false });

      if (gamesError) {
        console.error('❌ Error loading games:', gamesError);
        return [];
      }

      console.log('✅ Loaded', games?.length || 0, 'games');

      // Create a map of games for quick lookup
      const gamesMap = (games || []).reduce((acc, game) => {
        acc[game.id] = game;
        return acc;
      }, {} as any);

      // Combine bets with their corresponding game data
      const combinedData = bets.map(bet => ({
        id: bet.id,
        game_id: bet.game_id || '',
        user_id: bet.user_id || '',
        bet_type: bet.bet_type as 'color' | 'number',
        bet_value: bet.bet_value,
        amount: bet.amount,
        potential_win: bet.potential_win,
        is_winner: bet.is_winner || false,
        actual_win: bet.actual_win || 0,
        created_at: bet.created_at || new Date().toISOString(),
        game: {
          id: bet.game_id || '',
          game_number: gamesMap[bet.game_id || '']?.game_number || 0,
          result_color: gamesMap[bet.game_id || '']?.result_color || null,
          result_number: gamesMap[bet.game_id || '']?.result_number || null,
          start_time: gamesMap[bet.game_id || '']?.start_time || '',
          end_time: gamesMap[bet.game_id || '']?.end_time || '',
          status: gamesMap[bet.game_id || '']?.status || '',
          game_mode: gamesMap[bet.game_id || '']?.game_mode || 'classic',
          created_at: gamesMap[bet.game_id || '']?.created_at || ''
        }
      }));

      console.log('✅ Combined bet and game data successfully');
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
        .from('games')
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
        console.log('✅ Latest completed game loaded:', data.game_number);
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
        .filter(bet => bet.game.status === 'completed')
        .slice(0, limit);
      
      console.log('✅ Recent bet activity loaded:', recentBets.length, 'bets');
      return recentBets;
    } catch (error) {
      console.error('❌ Error loading recent bet activity:', error);
      return [];
    }
  }
}
