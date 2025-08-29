
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

      // Calculate potential profit
      let profit = amount;
      if (betType === 'color') {
        profit = betValue === 'purple-red' ? amount * 0.90 : amount * 0.95;
      } else {
        profit = amount * 9.0;
      }

      // Place bet using the current schema
      const { data: bet, error: betError } = await supabase
        .from('bets')
        .insert({
          user_id: userId,
          period_number: periodNumber,
          bet_type: betType,
          bet_value: betValue,
          amount: amount,
          profit: profit,
          status: 'pending'
        })
        .select()
        .single();

      if (betError) {
        console.error('Bet placement error:', betError);
        toast.error('Failed to place bet');
        return false;
      }

      // Update user balance in profiles table
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

      // Record transaction
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'bet',
          amount: -amount,
          balance_before: userBalance,
          balance_after: newBalance,
          description: `Bet on ${betValue} - Period #${periodNumber}`
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
