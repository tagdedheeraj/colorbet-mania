
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GAME_MODES } from '@/config/gameModes';

export class GameCreationService {
  private static isCreating = false;

  static async createNewGame(gameMode: string = 'quick'): Promise<any> {
    if (this.isCreating) {
      console.log('Game creation already in progress');
      return null;
    }

    this.isCreating = true;

    try {
      console.log('Creating new game with mode:', gameMode);

      // Get the latest period number to ensure proper sequence
      const { data: latestGame } = await supabase
        .from('game_periods')
        .select('period_number')
        .order('period_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextPeriodNumber = latestGame ? latestGame.period_number + 1 : 10001;
      const now = new Date();
      const modeConfig = GAME_MODES[gameMode as keyof typeof GAME_MODES] || GAME_MODES.quick;
      const endTime = new Date(now.getTime() + modeConfig.duration * 1000);

      console.log('Creating game with period number:', nextPeriodNumber);

      const { data: newGame, error } = await supabase
        .from('game_periods')
        .insert({
          period_number: nextPeriodNumber,
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          status: 'active',
          game_mode_type: 'automatic'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating new game:', error);
        toast.error('Failed to create new game');
        return null;
      }

      console.log('New game created successfully:', newGame.period_number);
      toast.success(`New game #${newGame.period_number} started!`);
      return newGame;
    } catch (error) {
      console.error('Error in createNewGame:', error);
      return null;
    } finally {
      this.isCreating = false;
    }
  }

  static async completeGame(gameId: string): Promise<boolean> {
    try {
      console.log('Completing game:', gameId);

      // Get game details
      const { data: gameData } = await supabase
        .from('game_periods')
        .select('*')
        .eq('id', gameId)
        .single();

      if (!gameData) {
        console.error('Game not found for completion');
        return false;
      }

      // Generate random result
      const colors = ['red', 'green', 'purple-red'];
      const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];

      console.log('Game result:', randomColor, randomNumber);

      // Complete the game
      const { error: updateError } = await supabase
        .from('game_periods')
        .update({
          status: 'completed',
          result_color: randomColor,
          result_number: randomNumber,
          end_time: new Date().toISOString()
        })
        .eq('id', gameId);

      if (updateError) {
        console.error('Error completing game:', updateError);
        return false;
      }

      // Process bets
      await this.processBetsForGame(gameData.period_number, randomColor, randomNumber);

      console.log('Game completed successfully');
      return true;
    } catch (error) {
      console.error('Error in completeGame:', error);
      return false;
    }
  }

  private static async processBetsForGame(periodNumber: number, resultColor: string, resultNumber: number) {
    try {
      console.log('Processing bets for period:', periodNumber);

      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('period_number', periodNumber)
        .eq('status', 'pending');

      if (betsError || !bets || bets.length === 0) {
        console.log('No bets to process');
        return;
      }

      console.log('Processing', bets.length, 'bets');

      for (const bet of bets) {
        let isWinner = false;
        let multiplier = 0;

        if (bet.bet_type === 'color') {
          if (bet.bet_value === resultColor) {
            isWinner = true;
            multiplier = resultColor === 'purple-red' ? 0.90 : 0.95;
          }
        } else if (bet.bet_type === 'number') {
          if (parseInt(bet.bet_value) === resultNumber && resultNumber !== 0) {
            isWinner = true;
            multiplier = 9.0;
          }
        }

        const profit = isWinner ? bet.amount * multiplier : -bet.amount;
        const totalPayout = isWinner ? bet.amount + (bet.amount * multiplier) : 0;

        // Update bet
        await supabase
          .from('bets')
          .update({
            status: 'completed',
            profit: profit
          })
          .eq('id', bet.id);

        // Update user balance if winner
        if (isWinner && totalPayout > 0) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', bet.user_id)
            .single();

          if (profile) {
            const newBalance = profile.balance + totalPayout;
            await supabase
              .from('profiles')
              .update({ balance: newBalance })
              .eq('id', bet.user_id);

            await supabase
              .from('transactions')
              .insert({
                user_id: bet.user_id,
                type: 'win',
                amount: totalPayout,
                balance_before: profile.balance,
                balance_after: newBalance,
                description: `Win from Game #${periodNumber} - ${bet.bet_value}`
              });
          }
        }
      }

      console.log('Bet processing completed');
    } catch (error) {
      console.error('Error processing bets:', error);
    }
  }
}
