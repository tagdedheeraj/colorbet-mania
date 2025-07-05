
import { supabase } from '@/integrations/supabase/client';

export class GameInitializationService {
  static async initializeGame() {
    try {
      console.log('Initializing game...');
      
      // First cleanup any expired games
      await this.cleanupOldGames();
      
      // Check for active games in game_periods table
      const { data: activeGames, error: activeError } = await supabase
        .from('game_periods')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (activeError) {
        console.error('Error checking active games:', activeError);
        return null;
      }

      // If there's an active game, check if it's valid
      if (activeGames && activeGames.length > 0) {
        const activeGame = activeGames[0];
        const now = new Date();
        
        // If end_time is null or invalid, set it properly
        if (!activeGame.end_time) {
          const endTime = new Date(now.getTime() + 60000);
          
          const { error: updateError } = await supabase
            .from('game_periods')
            .update({ end_time: endTime.toISOString() })
            .eq('id', activeGame.id);
            
          if (!updateError) {
            activeGame.end_time = endTime.toISOString();
            console.log('Fixed active game end_time:', activeGame.period_number);
          }
        }
        
        const endTime = new Date(activeGame.end_time);
        
        if (endTime > now) {
          console.log('Found valid active game:', activeGame.period_number, 'ending at:', endTime);
          return {
            id: activeGame.id,
            period_number: activeGame.period_number,
            end_time: activeGame.end_time,
            status: activeGame.status,
            created_at: activeGame.created_at
          };
        } else {
          // Game has expired, complete it
          console.log('Game has expired, completing it...');
          await this.completeExpiredGame(activeGame.id);
        }
      }

      // No valid active game found, create new one
      console.log('Creating new game...');
      return await this.createDemoGameIfNeeded();
    } catch (error) {
      console.error('Game initialization error:', error);
      return null;
    }
  }

  static async getCurrentGame() {
    try {
      const { data: games, error } = await supabase
        .from('game_periods')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching current game:', error);
        return null;
      }

      // If game exists but has no end_time, set it
      if (games && !games.end_time) {
        const now = new Date();
        const endTime = new Date(now.getTime() + 60000);
        
        const { error: updateError } = await supabase
          .from('game_periods')
          .update({ end_time: endTime.toISOString() })
          .eq('id', games.id);
          
        if (!updateError) {
          games.end_time = endTime.toISOString();
          console.log('Fixed missing end_time for game:', games.period_number);
        }
      }

      return games;
    } catch (error) {
      console.error('Error getting current game:', error);
      return null;
    }
  }

  static async cleanupOldGames() {
    try {
      console.log('Cleaning up old games...');
      
      // Complete any expired active games
      const now = new Date();
      const { data: expiredGames } = await supabase
        .from('game_periods')
        .select('*')
        .eq('status', 'active')
        .lt('end_time', now.toISOString());
        
      if (expiredGames && expiredGames.length > 0) {
        for (const game of expiredGames) {
          console.log('Completing expired game:', game.period_number);
          await this.completeExpiredGame(game.id);
        }
        console.log(`Completed ${expiredGames.length} expired games`);
      }
      
      return true;
    } catch (error) {
      console.error('Error cleaning up old games:', error);
      return false;
    }
  }

  static async createDemoGameIfNeeded(gameMode: string = 'quick') {
    try {
      console.log('Creating demo game if needed for mode:', gameMode);
      
      // Check if there's already an active game
      const activeGame = await this.getCurrentGame();
      if (activeGame) {
        console.log('Active game already exists:', activeGame.period_number);
        return activeGame;
      }

      // Get the next period number
      const { data: lastGame } = await supabase
        .from('game_periods')
        .select('period_number')
        .order('period_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextPeriodNumber = (lastGame?.period_number || 90001) + 1;
      const now = new Date();
      const endTime = new Date(now.getTime() + 60000); // 60 seconds from now

      console.log('Creating new game with period number:', nextPeriodNumber);

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
        console.error('Error creating demo game:', error);
        return null;
      }

      console.log('Created new demo game:', newGame.period_number);
      return newGame;
    } catch (error) {
      console.error('Error in createDemoGameIfNeeded:', error);
      return null;
    }
  }

  static async setupRealtimeSubscriptions(onGameUpdate: () => void, onBetUpdate: () => void) {
    try {
      console.log('Setting up realtime subscriptions...');
      
      // Subscribe to game_periods changes
      const gameChannel = supabase
        .channel('game_periods_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'game_periods'
        }, () => {
          console.log('Game periods changed');
          onGameUpdate();
        })
        .subscribe();

      // Subscribe to bets changes
      const betChannel = supabase
        .channel('bets_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'bets'
        }, () => {
          console.log('Bets changed');
          onBetUpdate();
        })
        .subscribe();

      return { gameChannel, betChannel };
    } catch (error) {
      console.error('Error setting up realtime subscriptions:', error);
      return null;
    }
  }

  static async loadInitialData() {
    try {
      console.log('Loading initial game data...');
      
      // Load active game
      const activeGame = await this.getCurrentGame();
      
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

      return {
        activeGame,
        gameHistory: gameHistory || []
      };
    } catch (error) {
      console.error('Error loading initial data:', error);
      return {
        activeGame: null,
        gameHistory: []
      };
    }
  }

  static async completeExpiredGame(gameId: string) {
    try {
      console.log('Completing expired game:', gameId);
      
      // Get the current game to check if it has manual results set
      const { data: currentGame } = await supabase
        .from('game_periods')
        .select('*')
        .eq('id', gameId)
        .single();

      if (!currentGame) {
        console.error('Game not found');
        return false;
      }

      let resultColor: string;
      let resultNumber: number;

      // Check if admin has set manual results
      if (currentGame.game_mode_type === 'manual' && 
          currentGame.admin_set_result_color && 
          currentGame.admin_set_result_number !== null) {
        // Use admin set results
        resultColor = currentGame.admin_set_result_color;
        resultNumber = currentGame.admin_set_result_number;
        console.log('Using admin set results:', resultColor, resultNumber);
      } else {
        // Generate random result for automatic mode
        const colors = ['red', 'green', 'purple-red'];
        const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        resultColor = colors[Math.floor(Math.random() * colors.length)];
        resultNumber = numbers[Math.floor(Math.random() * numbers.length)];
        console.log('Using random results:', resultColor, resultNumber);
      }

      const { error } = await supabase
        .from('game_periods')
        .update({
          status: 'completed',
          result_color: resultColor,
          result_number: resultNumber
        })
        .eq('id', gameId);

      if (error) {
        console.error('Error completing game:', error);
        return false;
      }

      // Process bets for this game
      await this.processBetsForCompletedGame(currentGame.period_number, resultColor, resultNumber);

      console.log('Game completed with result:', resultColor, resultNumber);
      return true;
    } catch (error) {
      console.error('Error in completeExpiredGame:', error);
      return false;
    }
  }

  static async processBetsForCompletedGame(periodNumber: number, resultColor: string, resultNumber: number) {
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

      // Process each bet
      for (const bet of bets) {
        let profit = 0;
        let isWinner = false;

        // Check if bet is a winner
        if (bet.bet_type === 'color' && bet.bet_value === resultColor) {
          isWinner = true;
          profit = bet.bet_value === 'purple-red' ? bet.amount * 0.9 : bet.amount * 0.95;
        } else if (bet.bet_type === 'number' && parseInt(bet.bet_value) === resultNumber) {
          isWinner = true;
          profit = bet.amount * 9.0;
        }

        // Update bet with result
        const { error: updateBetError } = await supabase
          .from('bets')
          .update({
            profit: isWinner ? profit : -bet.amount,
            status: 'completed'
          })
          .eq('id', bet.id);

        if (updateBetError) {
          console.error('Error updating bet:', bet.id, updateBetError);
          continue;
        }

        // If winner, add winnings to user balance
        if (isWinner) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', bet.user_id)
            .single();

          if (userProfile) {
            const newBalance = (userProfile.balance || 0) + bet.amount + profit;
            
            await supabase
              .from('profiles')
              .update({ balance: newBalance })
              .eq('id', bet.user_id);

            // Record win transaction
            await supabase
              .from('transactions')
              .insert({
                user_id: bet.user_id,
                type: 'win',
                amount: bet.amount + profit,
                balance_before: userProfile.balance || 0,
                balance_after: newBalance,
                description: `Win from ${bet.bet_type} bet on ${bet.bet_value} - Game #${periodNumber}`
              });

            console.log('Processed winning bet:', bet.id, 'profit:', profit);
          }
        }
      }

      console.log(`Processed ${bets.length} bets for period ${periodNumber}`);
    } catch (error) {
      console.error('Error processing bets:', error);
    }
  }
}
