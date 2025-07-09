
import { supabase } from '@/integrations/supabase/client';
import { LiveGameStats } from '@/types/adminGame';

export class GameStatsService {
  static async getCurrentGameStats(): Promise<LiveGameStats> {
    try {
      // Get active game
      const { data: activeGame, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (gameError) {
        console.error('Error fetching active game:', gameError);
      }

      if (!activeGame) {
        return {
          activeGame: null,
          totalBets: 0,
          totalBetAmount: 0,
          colorBets: {},
          numberBets: {},
          activePlayers: 0
        };
      }

      // Get all bets for current game
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('game_id', activeGame.id);

      if (betsError) {
        console.error('Error fetching bets:', betsError);
      }

      const colorBets: { [key: string]: { count: number; amount: number } } = {};
      const numberBets: { [key: string]: { count: number; amount: number } } = {};
      const uniqueUsers = new Set();
      let totalBetAmount = 0;

      bets?.forEach(bet => {
        totalBetAmount += parseFloat(bet.amount.toString());
        uniqueUsers.add(bet.user_id);

        if (bet.bet_type === 'color') {
          if (!colorBets[bet.bet_value]) {
            colorBets[bet.bet_value] = { count: 0, amount: 0 };
          }
          colorBets[bet.bet_value].count += 1;
          colorBets[bet.bet_value].amount += parseFloat(bet.amount.toString());
        } else if (bet.bet_type === 'number') {
          if (!numberBets[bet.bet_value]) {
            numberBets[bet.bet_value] = { count: 0, amount: 0 };
          }
          numberBets[bet.bet_value].count += 1;
          numberBets[bet.bet_value].amount += parseFloat(bet.amount.toString());
        }
      });

      return {
        activeGame,
        totalBets: bets?.length || 0,
        totalBetAmount,
        colorBets,
        numberBets,
        activePlayers: uniqueUsers.size
      };
    } catch (error) {
      console.error('Error getting game stats:', error);
      return {
        activeGame: null,
        totalBets: 0,
        totalBetAmount: 0,
        colorBets: {},
        numberBets: {},
        activePlayers: 0
      };
    }
  }
}
