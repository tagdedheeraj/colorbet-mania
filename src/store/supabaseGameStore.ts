
import { create } from 'zustand';
import { GameState } from '@/types/supabaseGame';
import { GameService } from '@/services/gameService';
import { GameInitializationService } from '@/services/gameInitializationService';
import { BetManagementService } from '@/services/betManagementService';
import { GameTimerService } from '@/services/gameTimerService';
import { GAME_MODES } from '@/config/gameModes';

const useSupabaseGameStore = create<GameState>((set, get) => ({
  currentGame: null,
  timeRemaining: 0,
  isAcceptingBets: false,
  gameHistory: [],
  currentBets: [],
  betAmount: 100,
  currentGameMode: 'quick',
  gameModesConfig: GAME_MODES,
  isLoading: true,

  initialize: async () => {
    console.log('Initializing game store...');
    set({ isLoading: true });
    
    try {
      // Set initialization timeout
      const initTimeout = setTimeout(() => {
        console.log('Game initialization timeout - setting loading to false');
        set({ isLoading: false });
      }, 8000);

      // Load game history first (this is fast)
      const gameHistory = await GameService.loadGameHistory();
      set({ gameHistory });

      // Try to load active game
      let activeGame = await GameService.loadActiveGame();
      
      if (!activeGame) {
        console.log('No active game found, creating demo game...');
        await GameInitializationService.createDemoGameIfNeeded();
        activeGame = await GameService.loadActiveGame();
      }

      // Clear the timeout since we have data
      clearTimeout(initTimeout);
      
      set({ 
        currentGame: activeGame,
        isLoading: false 
      });

      if (activeGame) {
        // Load bets and start timer
        await get().loadCurrentBets();
        get().startGameTimer();
      }

      // Setup real-time subscriptions (don't wait for this)
      setTimeout(() => {
        GameInitializationService.setupRealtimeSubscriptions(
          () => get().loadCurrentData(),
          () => get().loadCurrentBets()
        );
      }, 1000);

      console.log('Game store initialized successfully');
    } catch (error) {
      console.error('Game store initialization error:', error);
      set({ isLoading: false });
    }
  },

  createDemoGameIfNeeded: async () => {
    try {
      await GameInitializationService.createDemoGameIfNeeded();
    } catch (error) {
      console.error('Error creating demo game:', error);
    }
  },

  placeBet: async (type: 'color' | 'number', value: string) => {
    const { currentGame, betAmount, isAcceptingBets } = get();
    
    console.log('Placing bet:', { type, value, betAmount, isAcceptingBets });
    
    if (!isAcceptingBets) {
      console.error('Betting is currently closed');
      return;
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
  },

  setBetAmount: (amount: number) => {
    set({ betAmount: Math.max(10, amount) });
  },

  setGameMode: (mode) => {
    set({ currentGameMode: mode });
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
        currentGame.id // This will be replaced with actual user ID in BetManagementService
      );
      set({ currentBets });
    } catch (error) {
      console.error('Error loading current bets:', error);
    }
  },

  loadCurrentData: async () => {
    try {
      console.log('Loading current data...');
      const { activeGame, gameHistory } = await GameInitializationService.loadInitialData();
      
      const prevGame = get().currentGame;
      const gameChanged = !prevGame || prevGame.id !== activeGame?.id;
      
      set({ 
        currentGame: activeGame,
        gameHistory 
      });

      if (activeGame) {
        if (gameChanged) {
          if (prevGame) {
            GameTimerService.clearTimer(prevGame.id);
          }
          get().startGameTimer();
        }
        await get().loadCurrentBets();
      } else {
        // No active game, try to create one (but don't loop infinitely)
        const shouldCreateGame = !prevGame || Date.now() - new Date(prevGame.end_time).getTime() > 60000;
        if (shouldCreateGame) {
          console.log('Creating new game after delay...');
          setTimeout(async () => {
            await get().createDemoGameIfNeeded();
            const { activeGame: newGame } = await GameInitializationService.loadInitialData();
            if (newGame) {
              set({ currentGame: newGame });
              get().startGameTimer();
            }
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error loading current data:', error);
    }
  },

  startGameTimer: () => {
    const { currentGame, currentGameMode } = get();
    if (!currentGame) return;

    console.log('Starting game timer for game:', currentGame.game_number);

    GameTimerService.startGameTimer(
      currentGame,
      currentGameMode,
      (timeRemaining, isAcceptingBets) => {
        set({ timeRemaining, isAcceptingBets });
      },
      () => {
        console.log('Game ended, will create new game...');
        // Add delay before creating new game to prevent rapid cycling
        setTimeout(() => {
          get().createDemoGameIfNeeded().then(() => {
            get().loadCurrentData();
          });
        }, 3000);
      }
    );
  }
}));

export default useSupabaseGameStore;
