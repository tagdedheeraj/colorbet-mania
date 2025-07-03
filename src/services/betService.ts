
import { supabase } from '@/integrations/supabase/client';
import { GameService } from './gameService';
import { toast } from 'sonner';

export class BetService {
  static async placeBet(
    gameId: string,
    userId: string,
    betType: 'color' | 'number',
    betValue: string,
    amount: number,
    userBalance: number,
    gameNumber: number
  ): Promise<boolean> {
    try {
      console.log(`Placing bet: ${betType} ${betValue} for ${amount}`);
      
      const potentialWin = GameService.calculatePotentialWin(betType, betValue, amount);

      // Place bet
      const { error: betError } = await supabase
        .from('bets')
        .insert({
          user_id: userId,
          game_id: gameId,
          bet_type: betType,
          bet_value: betValue,
          amount: amount,
          potential_win: potentialWin
        });

      if (betError) {
        console.error('Bet placement error:', betError);
        throw betError;
      }

      // Update user balance
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: userBalance - amount })
        .eq('id', userId);

      if (balanceError) {
        console.error('Balance update error:', balanceError);
        throw balanceError;
      }

      // Add bet transaction
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'bet',
          amount: -amount,
          description: `Bet on ${betValue} - Game #${gameNumber}`
        });

      toast.success(`Bet placed on ${betValue}`);
      console.log(`Bet placed successfully: ${betType} ${betValue}`);
      return true;
    } catch (error) {
      console.error('Bet placement error:', error);
      toast.error('Failed to place bet');
      return false;
    }
  }
}
