
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
    periodNumber: number
  ): Promise<boolean> {
    try {
      console.log(`Placing bet: ${betType} ${betValue} for ${amount}`);
      
      const potentialWin = GameService.calculatePotentialWin(betType, betValue, amount);

      // Place bet using period_number instead of game_id
      const { error: betError } = await supabase
        .from('bets')
        .insert({
          user_id: userId,
          period_number: periodNumber,
          bet_type: betType,
          bet_value: betValue,
          amount: amount
        });

      if (betError) {
        console.error('Bet placement error:', betError);
        throw betError;
      }

      // Update user balance in profiles table
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: userBalance - amount })
        .eq('id', userId);

      if (balanceError) {
        console.error('Balance update error:', balanceError);
        throw balanceError;
      }

      // Add bet transaction with required fields
      const newBalance = userBalance - amount;
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'bet',
          amount: -amount,
          balance_before: userBalance,
          balance_after: newBalance,
          description: `Bet on ${betValue} - Game #${periodNumber}`
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
