
import { supabase } from '@/integrations/supabase/client';
import { GameResult, Bet, ColorType, NumberType, GameMode } from '@/types/supabaseGame';
import { GAME_MODES } from '@/config/gameModes';

export class GameService {
  static async loadActiveGame(): Promise<GameResult | null> {
    try {
      const { data: activeGame, error } = await supabase
        .from('games')
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
        game_number: activeGame.game_number,
        result_color: (activeGame.result_color as ColorType) || 'red',
        result_number: (activeGame.result_number as NumberType) || 0,
        start_time: activeGame.start_time,
        end_time: activeGame.end_time,
        status: activeGame.status || 'active'
      };
    } catch (error) {
      console.error('Error loading active game:', error);
      return null;
    }
  }

  static async loadGameHistory(): Promise<GameResult[]> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'completed')
        .order('game_number', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading game history:', error);
        return [];
      }
      
      return (data || []).map(game => ({
        id: game.id,
        game_number: game.game_number,
        result_color: (game.result_color as ColorType) || 'red',
        result_number: (game.result_number as NumberType) || 0,
        start_time: game.start_time,
        end_time: game.end_time,
        status: game.status || 'completed'
      }));
    } catch (error) {
      console.error('Error loading game history:', error);
      return [];
    }
  }

  static async loadCurrentBets(gameId: string, userId: string): Promise<Bet[]> {
    try {
      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading current bets:', error);
        return [];
      }
      
      return (data || []).map(bet => ({
        id: bet.id,
        game_id: bet.game_id || '',
        bet_type: bet.bet_type as 'color' | 'number',
        bet_value: bet.bet_value,
        amount: bet.amount,
        potential_win: bet.potential_win,
        is_winner: bet.is_winner || false,
        actual_win: bet.actual_win || 0
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

  static isAcceptingBets(timeRemaining: number, gameMode: GameMode, status: string): boolean {
    const totalDuration = GAME_MODES.find(m => m.id === gameMode)?.duration || 60;
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
