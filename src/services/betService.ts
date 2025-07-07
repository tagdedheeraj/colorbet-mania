
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
    gameNumber: number
  ): Promise<boolean> {
    try {
      console.log(`Placing bet: ${betType} ${betValue} for ${amount} on game ${gameNumber}`);
      
      // Validate inputs
      if (amount <= 0 || amount > userBalance) {
        toast.error('Invalid bet amount');
        return false;
      }

      if (userBalance < amount) {
        toast.error('Insufficient balance');
        return false;
      }

      // Calculate potential win
      let potentialWin = amount;
      if (betType === 'color') {
        potentialWin = betValue === 'purple-red' ? amount * 0.90 : amount * 0.95;
      } else {
        potentialWin = amount * 9.0;
      }

      // Place bet
      const { data: bet, error: betError } = await supabase
        .from('bets')
        .insert({
          user_id: userId,
          game_id: gameId,
          bet_type: betType,
          bet_value: betValue,
          amount: amount,
          potential_win: potentialWin
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
        .from('users')
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
          description: `Bet on ${betValue} - Game #${gameNumber}`
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
