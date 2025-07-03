
import { supabase } from '@/integrations/supabase/client';
import { GameService } from './gameService';
import { GameRealtimeService } from './gameRealtimeService';
import { GAME_MODES } from '@/config/gameModes';

export class GameInitializationService {
  static async cleanupOldGames(): Promise<void> {
    try {
      console.log('Cleaning up old active games...');
      
      // Mark all old active games as completed
      const { data: oldGames, error: fetchError } = await supabase
        .from('games')
        .select('id, end_time, game_number')
        .eq('status', 'active');

      if (fetchError) {
        console.error('Error fetching old games:', fetchError);
        return;
      }

      if (oldGames && oldGames.length > 0) {
        const now = new Date();
        const expiredGames = oldGames.filter(game => 
          new Date(game.end_time) < now
        );

        if (expiredGames.length > 0) {
          console.log(`Found ${expiredGames.length} expired games to complete`);
          
          // Complete each expired game through the edge function
          for (const game of expiredGames) {
            try {
              console.log(`Completing expired game: ${game.game_number} (${game.id})`);
              await this.completeExpiredGame(game.id);
            } catch (error) {
              console.error(`Error completing game ${game.id}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in cleanupOldGames:', error);
    }
  }

  static async createDemoGameIfNeeded(gameMode: string = 'quick'): Promise<void> {
    try {
      console.log('Checking for active games with mode:', gameMode);
      
      const { data: activeGames, error } = await supabase
        .from('games')
        .select('id, end_time, status, game_number, game_mode')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking for active games:', error);
        return;
      }

      let needsNewGame = true;
      if (activeGames && activeGames.length > 0) {
        const activeGame = activeGames[0];
        const timeRemaining = GameService.calculateTimeRemaining(activeGame.end_time);
        console.log(`Active game ${activeGame.game_number} has ${timeRemaining}s remaining`);
        
        if (timeRemaining > 0) {
          needsNewGame = false;
        } else {
          // Mark expired game as completed and process results
          console.log('Active game has expired, completing it...');
          await this.completeExpiredGame(activeGame.id);
        }
      }

      if (needsNewGame) {
        console.log('Creating new game with mode:', gameMode);
        
        // Get duration from game mode config
        const modeConfig = GAME_MODES.find(mode => mode.id === gameMode);
        const duration = modeConfig ? modeConfig.duration : 60;
        
        const gameNumber = Math.floor(Math.random() * 10000) + 1000;
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + duration * 1000);

        const { data: newGame, error: createError } = await supabase
          .from('games')
          .insert({
            game_number: gameNumber,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: 'active',
            game_mode: gameMode
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating demo game:', createError);
        } else {
          console.log(`New ${gameMode} game created: #${gameNumber} (${duration}s)`);
        }
      }
    } catch (error) {
      console.error('Error in createDemoGameIfNeeded:', error);
    }
  }

  static async completeExpiredGame(gameId: string): Promise<void> {
    try {
      console.log('Completing expired game:', gameId);
      
      // Call game-manager edge function to complete the game
      const { data, error } = await supabase.functions.invoke('game-manager', {
        body: { action: 'complete_game', gameId }
      });

      if (error) {
        console.error('Error completing game via edge function:', error);
        
        // Fallback: Mark as completed directly if edge function fails
        await supabase
          .from('games')
          .update({ status: 'completed' })
          .eq('id', gameId);
        
        console.log('Game marked as completed (fallback)');
      } else {
        console.log('Game completed successfully via edge function:', data);
      }
    } catch (error) {
      console.error('Error in completeExpiredGame:', error);
    }
  }

  static async loadInitialData() {
    try {
      console.log('Loading initial game data...');
      const activeGame = await GameService.loadActiveGame();
      const gameHistory = await GameService.loadGameHistory();
      
      console.log('Initial data loaded:', {
        activeGame: activeGame ? `Game #${activeGame.game_number}` : 'None',
        historyCount: gameHistory.length
      });
      
      return { activeGame, gameHistory };
    } catch (error) {
      console.error('Error loading initial data:', error);
      return { activeGame: null, gameHistory: [] };
    }
  }

  static setupRealtimeSubscriptions(
    onGameUpdate: () => void,
    onBetUpdate: () => void
  ) {
    try {
      const realtimeService = GameRealtimeService.getInstance();
      
      realtimeService.setupGameSubscription(() => {
        console.log('Game update received, refreshing data...');
        setTimeout(() => {
          onGameUpdate();
        }, 500); // Small delay to ensure data is consistent
      });

      realtimeService.setupBetSubscription(() => {
        console.log('Bet update received, refreshing bets...');
        onBetUpdate();
      });
    } catch (error) {
      console.error('Error setting up realtime subscriptions:', error);
    }
  }
}
