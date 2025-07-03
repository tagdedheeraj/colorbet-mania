
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
    set({ isLoading: true });
    try {
      console.log('Initializing game store...');
      
      // Create demo game if needed
      await get().createDemoGameIfNeeded();
      
      // Load initial data
      const { activeGame, gameHistory } = await GameInitializationService.loadInitialData();
      
      set({ 
        currentGame: activeGame,
        gameHistory,
        isLoading: false 
      });

      if (activeGame) {
        await get().loadCurrentBets();
        get().startGameTimer();
      } else {
        // Force create a new game if none exists
        await get().createDemoGameIfNeeded();
        await get().loadCurrentData();
      }

      // Setup real-time subscriptions
      GameInitializationService.setupRealtimeSubscriptions(
        () => get().loadCurrentData(),
        () => get().loadCurrentBets()
      );

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
        // No active game, create one
        await get().createDemoGameIfNeeded();
        const { activeGame: newGame } = await GameInitializationService.loadInitialData();
        if (newGame) {
          set({ currentGame: newGame });
          get().startGameTimer();
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
        console.log('Game ended, creating new game...');
        get().createDemoGameIfNeeded().then(() => {
          get().loadCurrentData();
        });
      }
    );
  }
}));

export default useSupabaseGameStore;
