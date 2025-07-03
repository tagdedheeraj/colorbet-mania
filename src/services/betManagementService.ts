
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
    console.log('Attempting to place bet:', {
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

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        toast.error('Error loading user data');
        return false;
      }

      if (!userProfile || (userProfile.balance || 0) < betAmount) {
        console.error('Insufficient balance:', userProfile?.balance, 'needed:', betAmount);
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

      return success;
    } catch (error) {
      console.error('Bet placement error:', error);
      toast.error('Failed to place bet');
      return false;
    }
  }

  static async loadCurrentBets(gameId: string, userId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return [];
      }

      console.log('Loading current bets for game:', gameId);
      const bets = await GameService.loadCurrentBets(gameId, session.user.id);
      console.log('Current bets loaded:', bets.length);
      return bets;
    } catch (error) {
      console.error('Error loading current bets:', error);
      return [];
    }
  }
}
