
import { create } from 'zustand';
import { GameState } from '@/types/supabaseGame';
import { useGameState } from './gameState';
import { BetManagementService } from '@/services/betManagementService';

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

  // Operations
  initialize: async () => {
    set({ isLoading: true });
    console.log('Store initialize called');
  },

  createDemoGameIfNeeded: async () => {
    console.log('createDemoGameIfNeeded called');
  },

  placeBet: async (type: 'color' | 'number', value: string) => {
    const state = get();
    const gameState = useGameState.getState();
    
    console.log('Placing bet:', { type, value, betAmount: state.betAmount, currentGame: state.currentGame?.id });
    
    if (!state.currentGame) {
      console.error('No active game found');
      return false;
    }

    if (!state.isAcceptingBets) {
      console.error('Betting is currently closed');
      return false;
    }

    try {
      const success = await BetManagementService.placeBet(
        state.currentGame,
        state.betAmount,
        type,
        value
      );

      if (success) {
        // Reload current bets after successful bet placement
        await get().loadCurrentBets();
        
        // Update game state as well
        gameState.setCurrentBets(gameState.currentBets);
        
        console.log('Bet placed successfully');
      }

      return success;
    } catch (error) {
      console.error('Error placing bet:', error);
      return false;
    }
  },

  setBetAmount: (amount: number) => {
    const validAmount = Math.max(10, amount);
    set({ betAmount: validAmount });
    useGameState.getState().setBetAmount(validAmount);
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
    console.log('loadGameHistory called');
  },

  loadCurrentBets: async () => {
    const state = get();
    if (!state.currentGame) return;

    try {
      const currentBets = await BetManagementService.loadCurrentBets(
        state.currentGame.id,
        state.currentGame.id
      );
      console.log('Current bets loaded:', currentBets.length);
      
      set({ currentBets });
      useGameState.getState().setCurrentBets(currentBets);
    } catch (error) {
      console.error('Error loading current bets:', error);
    }
  },

  loadUserGameResults: async (userId: string) => {
    console.log('loadUserGameResults called');
  },

  loadCurrentData: async () => {
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
