
import { supabase } from '@/integrations/supabase/client';

export interface LiveGameStats {
  activeGame: any;
  totalBets: number;
  totalBetAmount: number;
  colorBets: { [key: string]: { count: number; amount: number } };
  numberBets: { [key: string]: { count: number; amount: number } };
  activePlayers: number;
}

export class AdminGameService {
  static async getCurrentGameStats(): Promise<LiveGameStats> {
    try {
      // Get active game from games table
      const { data: activeGame } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

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
      const { data: bets } = await supabase
        .from('bets')
        .select('*')
        .eq('game_id', activeGame.id);

      const colorBets: { [key: string]: { count: number; amount: number } } = {};
      const numberBets: { [key: string]: { count: number; amount: number } } = {};
      const uniqueUsers = new Set();
      let totalBetAmount = 0;

      bets?.forEach(bet => {
        totalBetAmount += bet.amount;
        uniqueUsers.add(bet.user_id);

        if (bet.bet_type === 'color') {
          if (!colorBets[bet.bet_value]) {
            colorBets[bet.bet_value] = { count: 0, amount: 0 };
          }
          colorBets[bet.bet_value].count += 1;
          colorBets[bet.bet_value].amount += bet.amount;
        } else if (bet.bet_type === 'number') {
          if (!numberBets[bet.bet_value]) {
            numberBets[bet.bet_value] = { count: 0, amount: 0 };
          }
          numberBets[bet.bet_value].count += 1;
          numberBets[bet.bet_value].amount += bet.amount;
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
      throw error;
    }
  }

  static async setGameMode(gameId: string, mode: 'automatic' | 'manual'): Promise<boolean> {
    try {
      // Note: The games table doesn't have a game_mode_type column
      // This functionality may need to be added to the database schema
      console.log('Game mode setting not implemented - missing database column');
      return false;
    } catch (error) {
      console.error('Error setting game mode:', error);
      return false;
    }
  }

  static async setManualResult(gameId: string, color: string, number: number): Promise<boolean> {
    try {
      // Note: The games table doesn't have admin_set_result_color/number columns
      // This functionality may need to be added to the database schema
      console.log('Manual result setting not implemented - missing database columns');
      return false;
    } catch (error) {
      console.error('Error setting manual result:', error);
      return false;
    }
  }

  static async completeGameManually(gameId: string): Promise<boolean> {
    try {
      // Get the game
      const { data: game } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (!game) return false;

      // For now, just set a random result since we don't have admin columns
      const colors = ['red', 'green', 'purple-red'];
      const resultColor = colors[Math.floor(Math.random() * colors.length)];
      const resultNumber = Math.floor(Math.random() * 10);

      const { error } = await supabase
        .from('games')
        .update({
          status: 'completed',
          result_color: resultColor,
          result_number: resultNumber
        })
        .eq('id', gameId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error completing game manually:', error);
      return false;
    }
  }

  static async logAdminAction(action: string, details: any = {}) {
    try {
      await supabase
        .from('admin_logs')
        .insert({
          admin_user_id: 'admin-session', // This should be actual admin user ID
          action,
          details
        });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }
}
