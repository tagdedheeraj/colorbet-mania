import { create } from 'zustand';
import { GameMode, SupabaseGame } from '@/types/supabaseGame';
import { GAME_MODES } from '@/config/gameModes';
import { BetManagementService } from '@/services/betManagementService';
import { supabase } from '@/integrations/supabase/client';

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
  userBalance: number;
  
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
  setUserBalance: (balance: number) => void;
  
  // Game operations
  placeBet: (type: 'color' | 'number', value: string) => Promise<boolean>;
  loadCurrentBets: () => Promise<void>;
  loadUserBalance: () => Promise<void>;
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
  userBalance: 0,

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
  setUserBalance: (balance) => set({ userBalance: balance }),

  loadUserBalance: async () => {
    try {
      console.log('Loading user balance...');
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        console.log('No user found for balance loading');
        return;
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('balance')
        .eq('id', user.user.id)
        .single();

      if (error) {
        console.error('Error loading user balance:', error);
        // Don't set balance to 0 on error, keep existing value
        return;
      }

      const balance = userData?.balance || 0;
      set({ userBalance: balance });
      console.log('User balance loaded:', balance);
    } catch (error) {
      console.error('Error loading user balance:', error);
    }
  },

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

    // Check balance
    await get().loadUserBalance();
    const currentBalance = get().userBalance;
    
    if (currentBalance < state.betAmount) {
      console.error('Insufficient balance');
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
        // Reload current bets and balance after successful bet placement
        await get().loadCurrentBets();
        await get().loadUserBalance();
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
