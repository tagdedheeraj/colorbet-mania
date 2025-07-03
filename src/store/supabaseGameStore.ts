
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
      
      console.log('Setting initial state:', {
        activeGame: activeGame ? `Game #${activeGame.game_number}` : 'None',
        historyCount: gameHistory.length
      });
      
      set({ 
        currentGame: activeGame,
        gameHistory,
        isLoading: false 
      });

      // Load current user's bets if there's an active game
      if (activeGame) {
        await get().loadCurrentBets();
        // Start timer for current game
        get().startGameTimer();
      }

      // Setup real-time subscriptions
      GameInitializationService.setupRealtimeSubscriptions(
        () => get().loadCurrentData(),
        () => get().loadCurrentBets()
      );

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
    const { currentGame, betAmount, isAcceptingBets } = get();
    
    console.log('Store placeBet called:', {
      type,
      value,
      currentGame: currentGame ? `Game #${currentGame.game_number}` : 'None',
      betAmount,
      isAcceptingBets
    });
    
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
    if (!currentGame) {
      console.log('No current game, skipping bet loading');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('No authenticated user, skipping bet loading');
        return;
      }

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
      console.log('Loading current data...');
      const { activeGame, gameHistory } = await GameInitializationService.loadInitialData();
      
      const prevGame = get().currentGame;
      const gameChanged = !prevGame || prevGame.id !== activeGame?.id;
      
      console.log('Current data loaded:', {
        activeGame: activeGame ? `Game #${activeGame.game_number}` : 'None',
        gameChanged,
        prevGameId: prevGame?.id,
        newGameId: activeGame?.id
      });
      
      set({ 
        currentGame: activeGame,
        gameHistory 
      });

      if (activeGame) {
        if (gameChanged) {
          // Clear timer for previous game and start new one
          if (prevGame) {
            GameTimerService.clearTimer(prevGame.id);
          }
          get().startGameTimer();
        }
        await get().loadCurrentBets();
      }
    } catch (error) {
      console.error('Error loading current data:', error);
    }
  },

  startGameTimer: () => {
    const { currentGame, currentGameMode } = get();
    if (!currentGame) {
      console.log('No current game to start timer for');
      return;
    }

    console.log('Starting game timer for game:', currentGame.game_number);

    GameTimerService.startGameTimer(
      currentGame,
      currentGameMode,
      (timeRemaining, isAcceptingBets) => {
        set({ timeRemaining, isAcceptingBets });
      },
      () => {
        console.log('Game timer ended, creating new game...');
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
