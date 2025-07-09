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

      // Get the latest game number to ensure proper sequence
      const { data: latestGame } = await supabase
        .from('games')
        .select('game_number')
        .order('game_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextGameNumber = latestGame ? latestGame.game_number + 1 : 10001;
      const now = new Date();
      const modeConfig = GAME_MODES[gameMode as keyof typeof GAME_MODES] || GAME_MODES.quick;
      const endTime = new Date(now.getTime() + modeConfig.duration * 1000);

      console.log('Creating game with number:', nextGameNumber);

      const { data: newGame, error } = await supabase
        .from('games')
        .insert({
          game_number: nextGameNumber,
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          status: 'active',
          game_mode: gameMode
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating new game:', error);
        toast.error('Failed to create new game');
        return null;
      }

      console.log('New game created successfully:', newGame.game_number);
      toast.success(`New game #${newGame.game_number} started!`);
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
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (!gameData) {
        console.error('Game not found for completion');
        return false;
      }

      let resultColor: string;
      let resultNumber: number;

      // Check if this is a manually controlled game with admin-set result
      if (gameData.admin_controlled && gameData.admin_set_result_number !== null) {
        console.log('Using admin-set manual result:', gameData.admin_set_result_number);
        resultNumber = gameData.admin_set_result_number;
        
        // Determine color based on admin-set number
        if ([1, 3, 7, 9].includes(resultNumber)) {
          resultColor = 'red';
        } else if ([2, 4, 6, 8].includes(resultNumber)) {
          resultColor = 'green';
        } else if ([0, 5].includes(resultNumber)) {
          resultColor = 'purple-red';
        } else {
          resultColor = 'red';
        }
      } else {
        // Generate random result for automatic games
        const colors = ['red', 'green', 'purple-red'];
        const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        resultColor = colors[Math.floor(Math.random() * colors.length)];
        resultNumber = numbers[Math.floor(Math.random() * numbers.length)];
      }

      console.log('Game result:', { resultColor, resultNumber, wasManual: gameData.admin_controlled });

      // Complete the game
      const { error: updateError } = await supabase
        .from('games')
        .update({
          status: 'completed',
          result_color: resultColor,
          result_number: resultNumber,
          end_time: new Date().toISOString(),
          admin_notes: gameData.admin_controlled ? 'Completed with admin-set result' : null
        })
        .eq('id', gameId);

      if (updateError) {
        console.error('Error completing game:', updateError);
        return false;
      }

      // Process bets
      await this.processBetsForGame(gameData.game_number, resultColor, resultNumber);

      console.log('Game completed successfully');
      return true;
    } catch (error) {
      console.error('Error in completeGame:', error);
      return false;
    }
  }

  private static async processBetsForGame(gameNumber: number, resultColor: string, resultNumber: number) {
    try {
      console.log('Processing bets for game number:', gameNumber);

      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('game_id', (await supabase.from('games').select('id').eq('game_number', gameNumber).single()).data?.id);

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

        const actualWin = isWinner ? bet.amount * multiplier : 0;
        const totalPayout = isWinner ? bet.amount + actualWin : 0;

        // Update bet
        await supabase
          .from('bets')
          .update({
            is_winner: isWinner,
            actual_win: actualWin
          })
          .eq('id', bet.id);

        // Update user balance if winner
        if (isWinner && totalPayout > 0) {
          const { data: user } = await supabase
            .from('users')
            .select('balance')
            .eq('id', bet.user_id)
            .single();

          if (user) {
            const newBalance = (user.balance || 0) + totalPayout;
            await supabase
              .from('users')
              .update({ balance: newBalance })
              .eq('id', bet.user_id);

            await supabase
              .from('transactions')
              .insert({
                user_id: bet.user_id,
                type: 'win',
                amount: totalPayout,
                description: `Win from Game #${gameNumber} - ${bet.bet_value}`
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
