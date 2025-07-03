
import { create } from 'zustand';
import { GameState } from '@/types/supabaseGame';
import { GameService } from '@/services/gameService';
import { GameInitializationService } from '@/services/gameInitializationService';
import { BetManagementService } from '@/services/betManagementService';
import { GameTimerService } from '@/services/gameTimerService';
import { GAME_MODES } from '@/config/gameModes';
import { supabase } from '@/integrations/supabase/client';

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
      console.log('Initializing Supabase game store...');
      
      // First, try to create a demo game if none exists
      await get().createDemoGameIfNeeded();
      
      // Load initial data
      const { activeGame, gameHistory } = await GameInitializationService.loadInitialData();
      
      set({ 
        currentGame: activeGame,
        gameHistory,
        isLoading: false 
      });

      // Load current user's bets if there's an active game
      if (activeGame) {
        await get().loadCurrentBets();
      }

      // Setup real-time subscriptions
      GameInitializationService.setupRealtimeSubscriptions(
        () => get().loadCurrentData(),
        () => get().loadCurrentBets()
      );

      // Start timer for current game
      if (activeGame) {
        get().startGameTimer();
      }

      console.log('Supabase game store initialized successfully');
    } catch (error) {
      console.error('Supabase game store initialization error:', error);
      set({ isLoading: false });
    }
  },

  createDemoGameIfNeeded: async () => {
    await GameInitializationService.createDemoGameIfNeeded();
  },

  placeBet: async (type: 'color' | 'number', value: string) => {
    const { currentGame, betAmount } = get();
    
    const success = await BetManagementService.placeBet(
      currentGame,
      betAmount,
      type,
      value
    );

    if (success) {
      // Refresh current bets
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const currentBets = await BetManagementService.loadCurrentBets(
        currentGame.id,
        session.user.id
      );
      set({ currentBets });
    } catch (error) {
      console.error('Error loading current bets:', error);
    }
  },

  loadCurrentData: async () => {
    try {
      const { activeGame, gameHistory } = await GameInitializationService.loadInitialData();
      
      set({ 
        currentGame: activeGame,
        gameHistory 
      });

      if (activeGame) {
        get().startGameTimer();
        await get().loadCurrentBets();
      }
    } catch (error) {
      console.error('Error loading current data:', error);
    }
  },

  startGameTimer: () => {
    const { currentGame, currentGameMode } = get();
    if (!currentGame) return;

    GameTimerService.startGameTimer(
      currentGame,
      currentGameMode,
      (timeRemaining, isAcceptingBets) => {
        set({ timeRemaining, isAcceptingBets });
      },
      () => {
        // Game ended, create a new one
        get().createDemoGameIfNeeded().then(() => {
          // Reload data after creating new game
          get().loadCurrentData();
        });
      }
    );
  }
}));

export default useSupabaseGameStore;
