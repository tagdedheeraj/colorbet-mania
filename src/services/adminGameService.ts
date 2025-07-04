
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
      // Get active game
      const { data: activeGame } = await supabase
        .from('game_periods')
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
        .eq('period_number', activeGame.period_number);

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
      const { error } = await supabase
        .from('game_periods')
        .update({ game_mode_type: mode })
        .eq('id', gameId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error setting game mode:', error);
      return false;
    }
  }

  static async setManualResult(gameId: string, color: string, number: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('game_periods')
        .update({
          admin_set_result_color: color,
          admin_set_result_number: number,
          is_result_locked: true
        })
        .eq('id', gameId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error setting manual result:', error);
      return false;
    }
  }

  static async completeGameManually(gameId: string): Promise<boolean> {
    try {
      // Get the game with admin set results
      const { data: game } = await supabase
        .from('game_periods')
        .select('*')
        .eq('id', gameId)
        .single();

      if (!game) return false;

      const resultColor = game.admin_set_result_color || 'red';
      const resultNumber = game.admin_set_result_number || 0;

      const { error } = await supabase
        .from('game_periods')
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
