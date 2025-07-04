
import { create } from 'zustand';
import { GameMode, SupabaseGame } from '@/types/supabaseGame';
import { GAME_MODES } from '@/config/gameModes';
import { BetManagementService } from '@/services/betManagementService';

export interface GameStateSlice {
  currentGame: SupabaseGame | null;
  timeRemaining: number;
  isAcceptingBets: boolean;
  gameHistory: SupabaseGame[];
  currentBets: any[];
  betAmount: number;
  currentGameMode: GameMode;
  gameModesConfig: typeof GAME_MODES;
  isLoading: boolean;
  showResultPopup: boolean;
  lastCompletedGame: SupabaseGame | null;
  userGameResults: any[];
  
  // State setters
  setCurrentGame: (game: SupabaseGame | null) => void;
  setTimeRemaining: (time: number) => void;
  setIsAcceptingBets: (accepting: boolean) => void;
  setGameHistory: (history: SupabaseGame[]) => void;
  setCurrentBets: (bets: any[]) => void;
  setBetAmount: (amount: number) => void;
  setCurrentGameMode: (mode: GameMode) => void;
  setIsLoading: (loading: boolean) => void;
  setShowResultPopup: (show: boolean) => void;
  setLastCompletedGame: (game: SupabaseGame | null) => void;
  setUserGameResults: (results: any[]) => void;
  
  // Game operations
  placeBet: (type: 'color' | 'number', value: string) => Promise<boolean>;
  loadCurrentBets: () => Promise<void>;
}

export const useGameState = create<GameStateSlice>((set, get) => ({
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

  setCurrentGame: (game) => set({ currentGame: game }),
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  setIsAcceptingBets: (accepting) => set({ isAcceptingBets: accepting }),
  setGameHistory: (history) => set({ gameHistory: history }),
  setCurrentBets: (bets) => set({ currentBets: bets }),
  setBetAmount: (amount) => set({ betAmount: Math.max(10, amount) }),
  setCurrentGameMode: (mode) => set({ currentGameMode: mode }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setShowResultPopup: (show) => set({ showResultPopup: show }),
  setLastCompletedGame: (game) => set({ lastCompletedGame: game }),
  setUserGameResults: (results) => set({ userGameResults: results }),

  placeBet: async (type: 'color' | 'number', value: string) => {
    const state = get();
    
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
        console.log('Bet placed successfully');
      }

      return success;
    } catch (error) {
      console.error('Error placing bet:', error);
      return false;
    }
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
    } catch (error) {
      console.error('Error loading current bets:', error);
    }
  }
}));
