
import { supabase } from '@/integrations/supabase/client';
import { BetService } from './betService';
import { toast } from 'sonner';

export class BetManagementService {
  static async placeBet(
    currentGame: any,
    betAmount: number,
    type: 'color' | 'number',
    value: string
  ): Promise<boolean> {
    console.log('🎯 BetManagementService.placeBet called:', {
      gameId: currentGame?.id,
      periodNumber: currentGame?.period_number,
      betAmount,
      type,
      value,
      timestamp: new Date().toISOString()
    });

    if (!currentGame) {
      console.error('No active game found');
      toast.error('कोई active game available नहीं');
      return false;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.error('No authenticated user');
        toast.error('कृपया bet लगाने के लिए login करें');
        return false;
      }

      // Get fresh user balance from profiles table
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', session.user.id)
        .single();

      if (profileError || !userProfile) {
        console.error('Error fetching user profile:', profileError);
        toast.error('User data load करने में error');
        return false;
      }

      console.log('📊 Fresh user balance check:', {
        userId: session.user.id,
        currentBalance: userProfile.balance,
        betAmount,
        hasEnoughBalance: userProfile.balance >= betAmount
      });

      const currentBalance = userProfile.balance || 0;
      if (currentBalance < betAmount) {
        console.error('Insufficient balance:', currentBalance, 'needed:', betAmount);
        toast.error(`Balance कम है! आपके पास ${currentBalance} coins हैं, जरूरत ${betAmount} coins की`);
        return false;
      }

      // Enhanced validation
      if (betAmount < 10) {
        console.error('Minimum bet amount is 10');
        toast.error('Minimum bet amount ₹10 है');
        return false;
      }

      if (betAmount > 1000) {
        console.error('Maximum bet amount is 1000');
        toast.error('Maximum bet amount ₹1000 है');
        return false;
      }

      // Use period_number for bet placement
      const periodNumber = currentGame.period_number;
      if (!periodNumber) {
        console.error('Invalid period number');
        toast.error('Invalid game data');
        return false;
      }

      console.log('✅ Placing bet with enhanced validation:', {
        gameId: currentGame.id,
        periodNumber,
        userId: session.user.id,
        type,
        value,
        amount: betAmount,
        userBalance: currentBalance
      });

      const success = await BetService.placeBet(
        currentGame.id,
        session.user.id,
        type,
        value,
        betAmount,
        currentBalance,
        periodNumber
      );

      if (success) {
        console.log('🎉 Bet placed successfully:', {
          type,
          value,
          amount: betAmount,
          periodNumber,
          newBalance: currentBalance - betAmount
        });
        
        const newBalance = currentBalance - betAmount;
        toast.success(`✅ Bet successful! ${type === 'color' ? value : `Number ${value}`}`, {
          description: `Amount: ₹${betAmount} • New balance: ₹${newBalance}`,
          duration: 2000 // Shorter duration to prevent UI clutter
        });
      }

      return success;
    } catch (error) {
      console.error('❌ Bet placement error:', error);
      toast.error('Bet लगाने में server error');
      return false;
    }
  }

  static async loadCurrentBets(gameId: string, userId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return [];
      }

      // Get current game data from game_periods table
      const { data: currentGame } = await supabase
        .from('game_periods')
        .select('period_number')
        .eq('id', gameId)
        .single();

      if (!currentGame) {
        return [];
      }

      console.log('📊 Loading bets for period:', {
        gameId,
        periodNumber: currentGame.period_number,
        userId: session.user.id
      });

      // Load bets by period_number
      const { data: bets, error } = await supabase
        .from('bets')
        .select('*')
        .eq('period_number', currentGame.period_number)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading current bets:', error);
        return [];
      }

      console.log('📈 Current bets loaded successfully:', {
        periodNumber: currentGame.period_number,
        betsCount: bets?.length || 0,
        bets: bets?.map(bet => ({
          type: bet.bet_type,
          value: bet.bet_value,
          amount: bet.amount
        })) || []
      });
      
      return bets || [];
    } catch (error) {
      console.error('Error loading current bets:', error);
      return [];
    }
  }
}
