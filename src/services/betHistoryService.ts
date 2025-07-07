
import { supabase } from '@/integrations/supabase/client';
import { BetWithGame } from '@/types/supabaseGame';

export class BetHistoryService {
  static async loadAllUserBets(userId: string): Promise<BetWithGame[]> {
    try {
      // First get all user bets
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
        return [];
      }

      // Get unique game IDs from bets
      const gameIds = [...new Set(bets.map(bet => bet.game_id).filter(Boolean))];
      
      // Fetch game data for those game IDs
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .in('id', gameIds);

      if (gamesError) {
        console.error('Error loading games:', gamesError);
        return [];
      }

      // Create a map of games for quick lookup
      const gamesMap = (games || []).reduce((acc, game) => {
        acc[game.id] = game;
        return acc;
      }, {} as any);

      // Combine bets with their corresponding game data
      return bets.map(bet => ({
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
