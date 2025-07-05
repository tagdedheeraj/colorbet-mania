
import { create } from 'zustand';
import { GameState } from '@/types/supabaseGame';
import { useGameState } from './gameState';
import { useGameOperations } from './gameOperations'; 
import { useBettingOperations } from './bettingOperations';
import { useGameTimer } from './gameTimer';

const useSupabaseGameStore = create<GameState>((set, get) => ({
  // State from gameState
  currentGame: null,
  timeRemaining: 0,
  isAcceptingBets: false,
  gameHistory: [],
  currentBets: [],
  betAmount: 100,
  currentGameMode: 'quick',
  gameModesConfig: useGameState.getState().gameModesConfig,
  isLoading: false,
  showResultPopup: false,
  lastCompletedGame: null,
  userGameResults: [],

  // Operations - these will delegate to the separate hooks
  initialize: async () => {
    const gameOps = useGameOperations();
    await gameOps.initialize();
    
    // Sync state after initialization
    const state = useGameState.getState();
    set({
      currentGame: state.currentGame,
      gameHistory: state.gameHistory,
      isLoading: state.isLoading
    });

    if (state.currentGame) {
      const timer = useGameTimer();
      timer.startGameTimer();
    }
  },

  createDemoGameIfNeeded: async () => {
    const gameOps = useGameOperations();
    await gameOps.createDemoGameIfNeeded();
  },

  placeBet: async (type: 'color' | 'number', value: string) => {
    const bettingOps = useBettingOperations();
    const success = await bettingOps.placeBet(type, value);
    
    // Update local state
    const state = useGameState.getState();
    set({ currentBets: state.currentBets });
    
    return success;
  },

  setBetAmount: (amount: number) => {
    set({ betAmount: Math.max(10, amount) });
    const bettingOps = useBettingOperations();
    bettingOps.setBetAmount(amount);
  },

  setGameMode: (mode) => {
    set({ currentGameMode: mode });
    const bettingOps = useBettingOperations();
    bettingOps.setGameMode(mode);
    
    // If no active game, create new one with selected mode
    const { currentGame } = get();
    if (!currentGame) {
      setTimeout(() => {
        get().createDemoGameIfNeeded();
      }, 500);
    }
  },

  loadGameHistory: async () => {
    const gameOps = useGameOperations();
    await gameOps.loadGameHistory();
    
    const state = useGameState.getState();
    set({ gameHistory: state.gameHistory });
  },

  loadCurrentBets: async () => {
    const gameOps = useGameOperations();
    await gameOps.loadCurrentBets();
    
    const state = useGameState.getState();
    set({ currentBets: state.currentBets });
  },

  loadUserGameResults: async (userId: string) => {
    const gameOps = useGameOperations();
    await gameOps.loadUserGameResults(userId);
    
    const state = useGameState.getState();
    set({ userGameResults: state.userGameResults });
  },

  loadCurrentData: async () => {
    const gameOps = useGameOperations();
    await gameOps.loadCurrentData();
    
    // Sync state
    const state = useGameState.getState();
    set({
      currentGame: state.currentGame,
      gameHistory: state.gameHistory
    });
  },

  startGameTimer: () => {
    const timer = useGameTimer();
    timer.startGameTimer();
    
    // Set up state sync for timer updates
    const unsubscribe = useGameState.subscribe((state) => {
      set({
        timeRemaining: state.timeRemaining,
        isAcceptingBets: state.isAcceptingBets,
        showResultPopup: state.showResultPopup,
        lastCompletedGame: state.lastCompletedGame
      });
    });
    
    // Store unsubscribe function for cleanup if needed
    (window as any).gameStateUnsubscribe = unsubscribe;
  },

  closeResultPopup: () => {
    const timer = useGameTimer();
    timer.closeResultPopup();
    
    const state = useGameState.getState();
    set({
      showResultPopup: state.showResultPopup,
      lastCompletedGame: state.lastCompletedGame
    });
  }
}));

export default useSupabaseGameStore;
