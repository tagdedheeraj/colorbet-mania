
import { supabase } from '@/integrations/supabase/client';
import { GameService } from './gameService';
import { GameRealtimeService } from './gameRealtimeService';

export class GameInitializationService {
  static async createDemoGameIfNeeded(): Promise<void> {
    try {
      console.log('Checking for active games...');
      
      // Check if there are any active games that haven't expired
      const { data: activeGames, error } = await supabase
        .from('games')
        .select('id, end_time, status')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking for active games:', error);
        return;
      }

      console.log('Active games found:', activeGames);

      // Check if the active game has expired
      let needsNewGame = true;
      if (activeGames && activeGames.length > 0) {
        const activeGame = activeGames[0];
        const timeRemaining = GameService.calculateTimeRemaining(activeGame.end_time);
        console.log('Current active game time remaining:', timeRemaining);
        
        if (timeRemaining > 0) {
          needsNewGame = false;
          console.log('Active game is still valid, no need to create new one');
        } else {
          console.log('Active game has expired, will create new one');
        }
      }

      // If no active games or current game expired, create one
      if (needsNewGame) {
        console.log('Creating new demo game...');
        
        const gameNumber = Math.floor(Math.random() * 10000) + 1000;
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 60000); // 60 seconds from now

        const { error: createError } = await supabase
          .from('games')
          .insert({
            game_number: gameNumber,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: 'active',
            game_mode: 'quick'
          });

        if (createError) {
          console.error('Error creating demo game:', createError);
        } else {
          console.log('Demo game created successfully with number:', gameNumber);
        }
      }
    } catch (error) {
      console.error('Error in createDemoGameIfNeeded:', error);
    }
  }

  static async loadInitialData() {
    console.log('Loading initial game data...');
    const activeGame = await GameService.loadActiveGame();
    const gameHistory = await GameService.loadGameHistory();
    
    console.log('Initial data loaded:', {
      activeGame: activeGame ? `Game #${activeGame.game_number}` : 'None',
      historyCount: gameHistory.length
    });
    
    return { activeGame, gameHistory };
  }

  static setupRealtimeSubscriptions(
    onGameUpdate: () => void,
    onBetUpdate: () => void
  ) {
    const realtimeService = GameRealtimeService.getInstance();
    
    realtimeService.setupGameSubscription(() => {
      console.log('Game update received, refreshing data...');
      onGameUpdate();
    });

    realtimeService.setupBetSubscription(() => {
      console.log('Bet update received, refreshing bets...');
      onBetUpdate();
    });
  }
}
