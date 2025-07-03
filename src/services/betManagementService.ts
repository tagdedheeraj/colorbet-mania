
import { supabase } from '@/integrations/supabase/client';
import { BetService } from './betService';
import { GameService } from './gameService';
import { toast } from 'sonner';

export class BetManagementService {
  static async placeBet(
    currentGame: any,
    betAmount: number,
    type: 'color' | 'number',
    value: string
  ): Promise<boolean> {
    if (!currentGame) {
      toast.error('No active game');
      return false;
    }

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error('Please log in to place bets');
        return false;
      }

      // Get user profile for balance
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        toast.error('Error fetching user data');
        return false;
      }

      if (!userProfile || (userProfile.balance || 0) < betAmount) {
        toast.error('Insufficient balance');
        return false;
      }

      const success = await BetService.placeBet(
        currentGame.id,
        session.user.id,
        type,
        value,
        betAmount,
        userProfile.balance || 0,
        currentGame.game_number
      );

      if (success) {
        toast.success(`Bet placed successfully on ${value}!`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Bet placement error:', error);
      toast.error('Failed to place bet');
      return false;
    }
  }

  static async loadCurrentBets(gameId: string, userId: string) {
    try {
      return await GameService.loadCurrentBets(gameId, userId);
    } catch (error) {
      console.error('Error loading current bets:', error);
      return [];
    }
  }
}
