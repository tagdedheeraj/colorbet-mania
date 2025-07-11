
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
    console.log('BetManagementService.placeBet called:', {
      gameId: currentGame?.id,
      gameNumber: currentGame?.game_number,
      betAmount,
      type,
      value
    });

    if (!currentGame) {
      console.error('No active game found');
      toast.error('No active game available');
      return false;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.error('No authenticated user');
        toast.error('Please log in to place bets');
        return false;
      }

      // Get user profile with fresh balance from users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', session.user.id)
        .single();

      if (profileError || !userProfile) {
        console.error('Error fetching user profile:', profileError);
        toast.error('Error loading user data');
        return false;
      }

      console.log('User balance:', userProfile.balance);

      const currentBalance = userProfile.balance || 0;
      if (currentBalance < betAmount) {
        console.error('Insufficient balance:', currentBalance, 'needed:', betAmount);
        toast.error(`Insufficient balance! You have ${currentBalance} coins, need ${betAmount} coins`);
        return false;
      }

      // Use game_number for bet placement
      const gameNumber = currentGame.game_number;
      if (!gameNumber) {
        console.error('Invalid game number');
        toast.error('Invalid game data');
        return false;
      }

      console.log('Placing bet with game number:', gameNumber);

      const success = await BetService.placeBet(
        currentGame.id,
        session.user.id,
        type,
        value,
        betAmount,
        currentBalance,
        gameNumber
      );

      if (success) {
        console.log('Bet placed successfully');
        const newBalance = currentBalance - betAmount;
        toast.info(`New balance: ${newBalance} coins`);
      }

      return success;
    } catch (error) {
      console.error('Bet placement error:', error);
      toast.error('Failed to place bet - server error');
      return false;
    }
  }

  static async loadCurrentBets(gameId: string, userId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return [];
      }

      // Get current game data
      const { data: currentGame } = await supabase
        .from('games')
        .select('game_number')
        .eq('id', gameId)
        .single();

      if (!currentGame) {
        return [];
      }

      console.log('Loading bets for game:', currentGame.game_number);

      // Load bets by game_id directly since we don't have period_number in bets table
      const { data: bets, error } = await supabase
        .from('bets')
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading current bets:', error);
        return [];
      }

      console.log('Current bets loaded:', bets?.length || 0);
      return bets || [];
    } catch (error) {
      console.error('Error loading current bets:', error);
      return [];
    }
  }
}
