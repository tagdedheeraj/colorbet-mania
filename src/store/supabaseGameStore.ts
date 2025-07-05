
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
    // Get operations without calling hooks directly in the store
    let gameOps: any;
    let timer: any;
    
    // This function will be called from components where hooks are valid
    const initializeGame = async () => {
      gameOps = useGameOperations();
      timer = useGameTimer();
      
      await gameOps.initialize();
      
      // Sync state after initialization
      const state = useGameState.getState();
      set({
        currentGame: state.currentGame,
        gameHistory: state.gameHistory,
        isLoading: state.isLoading
      });

      if (state.currentGame) {
        console.log('Starting timer for current game:', state.currentGame.game_number);
        timer.startGameTimer();
      }
    };

    // Store the initialization function to be called from components
    (get() as any).initializeGame = initializeGame;
    
    // For now, just update loading state
    set({ isLoading: true });
  },

  createDemoGameIfNeeded: async () => {
    // This will be handled through proper component hooks
    console.log('createDemoGameIfNeeded called');
  },

  placeBet: async (type: 'color' | 'number', value: string) => {
    // This will be handled through proper component hooks
    console.log('placeBet called:', type, value);
    return false;
  },

  setBetAmount: (amount: number) => {
    set({ betAmount: Math.max(10, amount) });
    useGameState.getState().setBetAmount(amount);
  },

  setGameMode: (mode) => {
    set({ currentGameMode: mode });
    useGameState.getState().setCurrentGameMode(mode);
    
    // If no active game, create new one with selected mode
    const { currentGame } = get();
    if (!currentGame) {
      setTimeout(() => {
        get().createDemoGameIfNeeded();
      }, 500);
    }
  },

  loadGameHistory: async () => {
    // This will be handled through proper component hooks
    console.log('loadGameHistory called');
  },

  loadCurrentBets: async () => {
    // This will be handled through proper component hooks
    console.log('loadCurrentBets called');
  },

  loadUserGameResults: async (userId: string) => {
    // This will be handled through proper component hooks
    console.log('loadUserGameResults called');
  },

  loadCurrentData: async () => {
    // This will be handled through proper component hooks
    console.log('loadCurrentData called');
  },

  startGameTimer: () => {
    // Sync state for timer updates
    const unsubscribe = useGameState.subscribe((state) => {
      set({
        timeRemaining: state.timeRemaining,
        isAcceptingBets: state.isAcceptingBets,
        showResultPopup: state.showResultPopup,
        lastCompletedGame: state.lastCompletedGame,
        currentGame: state.currentGame
      });
    });
    
    // Store unsubscribe function for cleanup if needed
    (window as any).gameStateUnsubscribe = unsubscribe;
  },

  closeResultPopup: () => {
    useGameState.getState().setShowResultPopup(false);
    useGameState.getState().setLastCompletedGame(null);
    
    const state = useGameState.getState();
    set({
      showResultPopup: state.showResultPopup,
      lastCompletedGame: state.lastCompletedGame
    });
  }
}));

export default useSupabaseGameStore;
