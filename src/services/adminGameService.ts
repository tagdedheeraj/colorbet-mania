
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
      const { error } = await supabase
        .from('games')
        .update({
          game_mode_type: mode,
          admin_controlled: mode === 'manual'
        })
        .eq('id', gameId);

      if (error) {
        console.error('Error setting game mode:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error setting game mode:', error);
      return false;
    }
  }

  static async setManualResult(gameId: string, color: string, number: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('games')
        .update({
          admin_set_result_color: color,
          admin_set_result_number: number
        })
        .eq('id', gameId);

      if (error) {
        console.error('Error setting manual result:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error setting manual result:', error);
      return false;
    }
  }

  static async completeGameManually(gameId: string): Promise<boolean> {
    try {
      // Get the game with admin-set results
      const { data: game } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (!game) return false;

      // Use admin-set results if available, otherwise generate random
      let resultColor = game.admin_set_result_color;
      let resultNumber = game.admin_set_result_number;

      if (!resultColor || resultNumber === null) {
        const colors = ['red', 'green', 'purple-red'];
        resultColor = colors[Math.floor(Math.random() * colors.length)];
        resultNumber = Math.floor(Math.random() * 10);
      }

      const { error } = await supabase
        .from('games')
        .update({
          status: 'completed',
          result_color: resultColor,
          result_number: resultNumber,
          end_time: new Date().toISOString()
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
      const { data: user } = await supabase.auth.getUser();
      
      await supabase
        .from('admin_logs')
        .insert({
          admin_user_id: user.user?.id || 'unknown',
          action,
          details
        });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }
}
