
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

      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
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

      // Use game_number (period_number) for bet placement
      const periodNumber = currentGame.game_number || currentGame.period_number;
      if (!periodNumber) {
        console.error('Invalid game number/period number');
        toast.error('Invalid game data');
        return false;
      }

      console.log('Placing bet with period number:', periodNumber);

      const success = await BetService.placeBet(
        currentGame.id,
        session.user.id,
        type,
        value,
        betAmount,
        userProfile.balance || 0,
        periodNumber
      );

      if (success) {
        toast.success(`Bet placed on ${value}!`);
      }

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
