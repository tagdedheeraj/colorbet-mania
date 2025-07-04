
import { create } from 'zustand';
import { GameState } from '@/types/supabaseGame';
import { GameService } from '@/services/gameService';
import { GameInitializationService } from '@/services/gameInitializationService';
import { BetManagementService } from '@/services/betManagementService';
import { BetHistoryService } from '@/services/betHistoryService';
import { GameTimerService } from '@/services/gameTimerService';
import { GAME_MODES } from '@/config/gameModes';
import { toast } from 'sonner';

let isInitializing = false;

const useSupabaseGameStore = create<GameState>((set, get) => ({
  currentGame: null,
  timeRemaining: 0,
  isAcceptingBets: false,
  gameHistory: [],
  currentBets: [],
  betAmount: 100,
  currentGameMode: 'quick',
  gameModesConfig: GAME_MODES,
  isLoading: false,
  showResultPopup: false,
  lastCompletedGame: null,
  userGameResults: [],

  initialize: async () => {
    if (isInitializing) return;
    isInitializing = true;

    console.log('Initializing game store...');
    set({ isLoading: true });
    
    try {
      // Set timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.log('Game initialization timeout');
        set({ isLoading: false });
        isInitializing = false;
      }, 8000);

      // First clean up old active games in database
      await GameInitializationService.cleanupOldGames();

      // Load game history (fast operation)
      const gameHistory = await GameService.loadGameHistory();
      set({ gameHistory });

      // Try to load or create active game with current game mode
      let activeGame = await GameService.loadActiveGame();
      
      if (!activeGame) {
        console.log('No active game found, creating new game...');
        const currentGameMode = get().currentGameMode;
        await GameInitializationService.createDemoGameIfNeeded(currentGameMode);
        activeGame = await GameService.loadActiveGame();
      }

      clearTimeout(timeout);
      
      set({ 
        currentGame: activeGame,
        isLoading: false 
      });

      if (activeGame) {
        await get().loadCurrentBets();
        get().startGameTimer();
      }

      // Setup realtime subscriptions (non-blocking)
      setTimeout(() => {
        GameInitializationService.setupRealtimeSubscriptions(
          () => get().loadCurrentData(),
          () => get().loadCurrentBets()
        );
      }, 1000);

      console.log('Game store initialized successfully');
      isInitializing = false;
    } catch (error) {
      console.error('Game store initialization error:', error);
      set({ isLoading: false });
      isInitializing = false;
    }
  },

  createDemoGameIfNeeded: async () => {
    try {
      const currentGameMode = get().currentGameMode;
      await GameInitializationService.createDemoGameIfNeeded(currentGameMode);
    } catch (error) {
      console.error('Error creating demo game:', error);
    }
  },

  placeBet: async (type: 'color' | 'number', value: string) => {
    const { currentGame, betAmount, isAcceptingBets } = get();
    
    console.log('Placing bet:', { type, value, betAmount, isAcceptingBets, currentGame: currentGame?.id });
    
    if (!isAcceptingBets) {
      console.error('Betting is currently closed');
      return false;
    }
    
    const success = await BetManagementService.placeBet(
      currentGame,
      betAmount,
      type,
      value
    );

    if (success) {
      await get().loadCurrentBets();
    }

    return success;
  },

  setBetAmount: (amount: number) => {
    set({ betAmount: Math.max(10, amount) });
  },

  setGameMode: (mode) => {
    console.log('Setting game mode to:', mode);
    set({ currentGameMode: mode });
    
    // If no active game, create new one with selected mode
    const { currentGame } = get();
    if (!currentGame) {
      setTimeout(() => {
        get().createDemoGameIfNeeded();
      }, 500);
    }
  },

  loadGameHistory: async () => {
    try {
      const gameHistory = await GameService.loadGameHistory();
      set({ gameHistory });
    } catch (error) {
      console.error('Error loading game history:', error);
    }
  },

  loadCurrentBets: async () => {
    const { currentGame } = get();
    if (!currentGame) return;

    try {
      const currentBets = await BetManagementService.loadCurrentBets(
        currentGame.id,
        currentGame.id
      );
      console.log('Current bets loaded:', currentBets.length);
      set({ currentBets });
    } catch (error) {
      console.error('Error loading current bets:', error);
    }
  },

  loadUserGameResults: async (userId: string) => {
    try {
      const userGameResults = await BetHistoryService.loadAllUserBets(userId);
      set({ userGameResults });
    } catch (error) {
      console.error('Error loading user game results:', error);
    }
  },

  loadCurrentData: async () => {
    try {
      console.log('Loading current data...');
      const { activeGame, gameHistory } = await GameInitializationService.loadInitialData();
      
      const prevGame = get().currentGame;
      const gameChanged = !prevGame || prevGame.id !== activeGame?.id;
      
      // Convert activeGame to SupabaseGame format if it exists
      const formattedActiveGame = activeGame ? {
        id: activeGame.id,
        game_number: activeGame.period_number,
        result_color: activeGame.result_color,
        result_number: activeGame.result_number,
        start_time: activeGame.start_time,
        end_time: activeGame.end_time,
        status: activeGame.status || 'active',
        game_mode: 'quick', // Default since not in schema
        created_at: activeGame.created_at || new Date().toISOString()
      } : null;

      // Transform gameHistory to match SupabaseGame format
      const formattedGameHistory = gameHistory.map((game: any) => ({
        id: game.id,
        game_number: game.period_number,
        result_color: game.result_color,
        result_number: game.result_number,
        start_time: game.start_time,
        end_time: game.end_time,
        status: game.status || 'completed',
        game_mode: 'quick', // Default since not in schema
        created_at: game.created_at || new Date().toISOString()
      }));
      
      set({ 
        currentGame: formattedActiveGame,
        gameHistory: formattedGameHistory
      });

      if (formattedActiveGame && gameChanged) {
        console.log('Game changed, updating bets and timer');
        if (prevGame) {
          GameTimerService.clearTimer(prevGame.id);
        }
        
        // Load bets first, then start timer
        await get().loadCurrentBets();
        get().startGameTimer();
      } else if (formattedActiveGame) {
        // Same game, just refresh bets
        await get().loadCurrentBets();
      }
    } catch (error) {
      console.error('Error loading current data:', error);
    }
  },

  startGameTimer: () => {
    const { currentGame, currentGameMode } = get();
    if (!currentGame) return;

    const gameMode = currentGame.game_mode || currentGameMode;
    console.log('Starting game timer for game:', currentGame.game_number, 'mode:', gameMode);

    GameTimerService.startGameTimer(
      currentGame,
      gameMode,
      (timeRemaining, isAcceptingBets) => {
        set({ timeRemaining, isAcceptingBets });
      },
      async () => {
        console.log('Game timer ended, completing game and showing results...');
        
        const { currentGame: gameToComplete } = get();
        if (gameToComplete) {
          try {
            // Complete the current game
            await GameInitializationService.completeExpiredGame(gameToComplete.id);
            
            // Wait for the edge function to process
            setTimeout(async () => {
              // Get the completed game details
              const completedGame = await BetHistoryService.getLatestCompletedGame();
              
              if (completedGame) {
                // Transform completedGame to match SupabaseGame format
                const formattedCompletedGame = {
                  id: completedGame.id,
                  game_number: completedGame.period_number || (completedGame as any).game_number,
                  result_color: completedGame.result_color,
                  result_number: completedGame.result_number,
                  start_time: completedGame.start_time,
                  end_time: completedGame.end_time,
                  status: completedGame.status || 'completed',
                  game_mode: 'quick', // Default since not in schema
                  created_at: completedGame.created_at || new Date().toISOString()
                };

                set({ 
                  lastCompletedGame: formattedCompletedGame,
                  showResultPopup: true 
                });
                
                // Show result toast
                toast.success(`Game ${formattedCompletedGame.game_number} completed! Result: ${formattedCompletedGame.result_color} ${formattedCompletedGame.result_number}`);
              }
              
              // Refresh all data to get the completed game and results
              await get().loadCurrentData();
              
              // Create new game after a short delay
              setTimeout(async () => {
                await get().createDemoGameIfNeeded();
                // Load data again to get the new game
                setTimeout(() => {
                  get().loadCurrentData();
                }, 1000);
              }, 2000);
            }, 1000);
            
          } catch (error) {
            console.error('Error in game completion process:', error);
          }
        }
      }
    );
  },

  closeResultPopup: () => {
    set({ showResultPopup: false, lastCompletedGame: null });
  }
}));

export default useSupabaseGameStore;
