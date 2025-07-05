
import { supabase } from '@/integrations/supabase/client';
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
      console.log(`Placing bet: ${betType} ${betValue} for ${amount} on period ${periodNumber}`);
      
      // Validate inputs
      if (amount <= 0 || amount > userBalance) {
        toast.error('Invalid bet amount');
        return false;
      }

      if (userBalance < amount) {
        toast.error('Insufficient balance');
        return false;
      }

      // Place bet
      const { data: bet, error: betError } = await supabase
        .from('bets')
        .insert({
          user_id: userId,
          period_number: periodNumber,
          bet_type: betType,
          bet_value: betValue,
          amount: amount,
          status: 'pending'
        })
        .select()
        .single();

      if (betError) {
        console.error('Bet placement error:', betError);
        toast.error('Failed to place bet');
        return false;
      }

      // Update user balance
      const newBalance = userBalance - amount;
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (balanceError) {
        console.error('Balance update error:', balanceError);
        toast.error('Failed to update balance');
        return false;
      }

      // Add transaction record
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

      toast.success(`Bet placed successfully on ${betValue}!`);
      console.log(`Bet placed successfully: ${betType} ${betValue}`);
      return true;
    } catch (error) {
      console.error('Bet placement error:', error);
      toast.error('Failed to place bet');
      return false;
    }
  }
}
