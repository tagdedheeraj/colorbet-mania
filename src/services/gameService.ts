
import { supabase } from '@/integrations/supabase/client';
import { SupabaseGame, SupabaseBet, ColorType, NumberType, GameMode } from '@/types/supabaseGame';
import { GAME_MODES } from '@/config/gameModes';

export class GameService {
  static async loadActiveGame(): Promise<SupabaseGame | null> {
    try {
      const { data: activeGame, error } = await supabase
        .from('game_periods')
        .select('*')
        .in('status', ['active', 'betting_closed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading active game:', error);
        return null;
      }

      if (!activeGame) {
        console.log('No active game found');
        return null;
      }

      return {
        id: activeGame.id,
        game_number: activeGame.period_number,
        result_color: activeGame.result_color,
        result_number: activeGame.result_number,
        start_time: activeGame.start_time,
        end_time: activeGame.end_time,
        status: activeGame.status || 'active',
        game_mode: 'quick', // Default since game_mode doesn't exist in game_periods
        created_at: activeGame.created_at || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error loading active game:', error);
      return null;
    }
  }

  static async loadGameHistory(): Promise<SupabaseGame[]> {
    try {
      const { data, error } = await supabase
        .from('game_periods')
        .select('*')
        .eq('status', 'completed')
        .order('period_number', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading game history:', error);
        return [];
      }
      
      return (data || []).map(game => ({
        id: game.id,
        game_number: game.period_number,
        result_color: game.result_color,
        result_number: game.result_number,
        start_time: game.start_time,
        end_time: game.end_time,
        status: game.status || 'completed',
        game_mode: 'quick', // Default since game_mode doesn't exist
        created_at: game.created_at || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error loading game history:', error);
      return [];
    }
  }

  static async loadCurrentBets(gameId: string, userId: string): Promise<SupabaseBet[]> {
    try {
      // Try to get the period_number from the gameId first
      const { data: gameData } = await supabase
        .from('game_periods')
        .select('period_number')
        .eq('id', gameId)
        .single();

      if (!gameData) {
        console.error('Game not found for gameId:', gameId);
        return [];
      }

      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('period_number', gameData.period_number)
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading current bets:', error);
        return [];
      }
      
      return (data || []).map(bet => ({
        id: bet.id,
        game_id: gameId,
        user_id: bet.user_id || '',
        bet_type: bet.bet_type,
        bet_value: bet.bet_value,
        amount: bet.amount,
        potential_win: bet.amount * 2, // Simple calculation
        is_winner: bet.profit ? bet.profit > 0 : false,
        actual_win: bet.profit || 0,
        created_at: bet.created_at || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error loading current bets:', error);
      return [];
    }
  }

  static calculateTimeRemaining(endTime: string): number {
    const endTimeMs = new Date(endTime).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((endTimeMs - now) / 1000));
  }

  static isAcceptingBets(timeRemaining: number, gameMode: string, status: string): boolean {
    const modeConfig = GAME_MODES[gameMode as GameMode];
    const totalDuration = modeConfig?.duration || 60;
    const betsClosingTime = Math.max(10, Math.floor(totalDuration * 0.15));
    return timeRemaining > betsClosingTime && status === 'active';
  }

  static calculatePotentialWin(betType: 'color' | 'number', betValue: string, amount: number): number {
    let multiplier = 1;
    if (betType === 'color') {
      multiplier = betValue === 'purple-red' ? 0.90 : 0.95;
    } else {
      multiplier = 9.0;
    }
    return amount * multiplier;
  }
}
