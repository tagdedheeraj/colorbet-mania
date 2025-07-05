
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export class GameInitializationService {
  private static isInitializing = false;

  static async cleanupOldGames(): Promise<void> {
    try {
      console.log('Cleaning up old games...');
      
      // Complete games that are older than 2 minutes and still active
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('game_periods')
        .update({
          status: 'completed',
          result_color: 'green',
          result_number: 3,
          end_time: twoMinutesAgo
        })
        .lt('start_time', twoMinutesAgo)
        .eq('status', 'active');

      if (error) {
        console.error('Error cleaning up old games:', error);
      } else {
        console.log('Old games cleaned up successfully');
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  static async loadInitialData() {
    console.log('Loading initial game data...');
    
    try {
      // Load active game
      const { data: activeGame, error: activeError } = await supabase
        .from('game_periods')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeError) {
        console.error('Error loading active game:', activeError);
      }

      // Load game history
      const { data: gameHistory, error: historyError } = await supabase
        .from('game_periods')
        .select('*')
        .eq('status', 'completed')
        .order('period_number', { ascending: false })
        .limit(10);

      if (historyError) {
        console.error('Error loading game history:', historyError);
      }

      console.log('Initial data loaded:', {
        activeGame: activeGame?.period_number,
        historyCount: gameHistory?.length || 0
      });

      return {
        activeGame,
        gameHistory: gameHistory || []
      };
    } catch (error) {
      console.error('Error in loadInitialData:', error);
      return {
        activeGame: null,
        gameHistory: []
      };
    }
  }

  static async createDemoGameIfNeeded(gameMode: string = 'quick'): Promise<any> {
    if (this.isInitializing) {
      console.log('Game creation already in progress');
      return null;
    }

    this.isInitializing = true;

    try {
      console.log('Creating demo game if needed for mode:', gameMode);

      // Check if there's already an active game
      const { data: existingGame } = await supabase
        .from('game_periods')
        .select('*')
        .eq('status', 'active')
        .maybeSingle();

      if (existingGame) {
        console.log('Active game already exists:', existingGame.period_number);
        this.isInitializing = false;
        return existingGame;
      }

      // Get the latest period number
      const { data: latestGame } = await supabase
        .from('game_periods')
        .select('period_number')
        .order('period_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextPeriodNumber = latestGame ? latestGame.period_number + 1 : 90003;
      const now = new Date();
      const endTime = new Date(now.getTime() + 60000); // 60 seconds from now

      console.log('Creating new game:', nextPeriodNumber);

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
        this.isInitializing = false;
        return null;
      }

      console.log('New game created successfully:', newGame.period_number);
      this.isInitializing = false;
      return newGame;
    } catch (error) {
      console.error('Error in createDemoGameIfNeeded:', error);
      this.isInitializing = false;
      return null;
    }
  }

  static async completeExpiredGame(gameId: string): Promise<boolean> {
    try {
      console.log('Completing expired game:', gameId);

      // Get game details first
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

      console.log('Using random results:', randomColor, randomNumber);

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

      // Process bets for this period
      await this.processBetsForPeriod(gameData.period_number, randomColor, randomNumber);

      console.log('Game completed with result:', randomColor, randomNumber);
      return true;
    } catch (error) {
      console.error('Error in completeExpiredGame:', error);
      return false;
    }
  }

  static async processBetsForPeriod(periodNumber: number, resultColor: string, resultNumber: number) {
    try {
      console.log('Processing bets for period:', periodNumber, 'result:', resultColor, resultNumber);

      // Get all bets for this period
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('period_number', periodNumber)
        .eq('status', 'pending');

      if (betsError) {
        console.error('Error fetching bets:', betsError);
        return;
      }

      if (!bets || bets.length === 0) {
        console.log('No bets to process for period:', periodNumber);
        return;
      }

      console.log('Processing', bets.length, 'bets');

      // Process each bet
      for (const bet of bets) {
        let isWinner = false;
        let multiplier = 0;

        if (bet.bet_type === 'color') {
          if (bet.bet_value === resultColor) {
            isWinner = true;
            multiplier = resultColor === 'purple-red' ? 0.90 : 0.95;
          }
        } else if (bet.bet_type === 'number') {
          if (parseInt(bet.bet_value) === resultNumber) {
            isWinner = true;
            multiplier = 9.0;
          }
        }

        const profit = isWinner ? bet.amount * multiplier : -bet.amount;
        const totalPayout = isWinner ? bet.amount + (bet.amount * multiplier) : 0;

        // Update bet with result
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

            // Add win transaction
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

      console.log('Bet processing completed for period:', periodNumber);
    } catch (error) {
      console.error('Error processing bets:', error);
    }
  }

  static setupRealtimeSubscriptions(onGameUpdate: () => void, onBetUpdate: () => void) {
    try {
      console.log('Setting up realtime subscriptions...');
      
      // Subscribe to game_periods changes
      const gameChannel = supabase
        .channel('game_periods_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_periods'
          },
          (payload) => {
            console.log('Game period changed:', payload);
            onGameUpdate();
          }
        )
        .subscribe();

      // Subscribe to bets changes
      const betsChannel = supabase
        .channel('bets_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bets'
          },
          (payload) => {
            console.log('Bet changed:', payload);
            onBetUpdate();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(gameChannel);
        supabase.removeChannel(betsChannel);
      };
    } catch (error) {
      console.error('Error setting up realtime subscriptions:', error);
      return () => {};
    }
  }
}
