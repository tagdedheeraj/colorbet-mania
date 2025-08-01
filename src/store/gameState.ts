
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
  
  // New state for better bet management
  isBettingInProgress: boolean;
  lastBetTimestamp: number;
  
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
  setIsBettingInProgress: (inProgress: boolean) => void;
  
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
  betAmount: 10,
  currentGameMode: 'quick',
  gameModesConfig: GAME_MODES,
  isLoading: false,
  showResultPopup: false,
  lastCompletedGame: null,
  userGameResults: [],
  userBalance: 0,
  isBettingInProgress: false,
  lastBetTimestamp: 0,

  setCurrentGame: (game) => set({ currentGame: game }),
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  setIsAcceptingBets: (accepting) => set({ isAcceptingBets: accepting }),
  setGameHistory: (history) => set({ gameHistory: history }),
  setCurrentBets: (bets) => set({ currentBets: bets }),
  setBetAmount: (amount) => {
    const state = get();
    const maxAffordable = Math.min(state.userBalance, 1000);
    const validAmount = Math.max(10, Math.min(amount, maxAffordable));
    set({ betAmount: validAmount });
  },
  setCurrentGameMode: (mode) => set({ currentGameMode: mode }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setShowResultPopup: (show) => set({ showResultPopup: show }),
  setLastCompletedGame: (game) => set({ lastCompletedGame: game }),
  setUserGameResults: (results) => set({ userGameResults: results }),
  setUserBalance: (balance) => {
    const state = get();
    set({ userBalance: balance });
    // Auto-adjust bet amount if current bet exceeds balance
    if (state.betAmount > balance) {
      const newBetAmount = Math.max(10, Math.min(balance, 100));
      set({ betAmount: newBetAmount });
    }
  },
  setIsBettingInProgress: (inProgress) => set({ isBettingInProgress: inProgress }),

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
        return;
      }

      const balance = userData?.balance || 0;
      const state = get();
      state.setUserBalance(balance);
      console.log('User balance loaded:', balance);
    } catch (error) {
      console.error('Error loading user balance:', error);
    }
  },

  placeBet: async (type: 'color' | 'number', value: string) => {
    const state = get();
    
    console.log('🎯 Placing bet:', { type, value, betAmount: state.betAmount, currentGame: state.currentGame?.id });
    
    if (!state.currentGame) {
      console.error('No active game found');
      return false;
    }

    if (!state.isAcceptingBets) {
      console.error('Betting is currently closed');
      return false;
    }

    // Set betting in progress to prevent UI state reset
    set({ isBettingInProgress: true });

    // Check balance before placing bet
    await get().loadUserBalance();
    const currentBalance = get().userBalance;
    
    if (currentBalance < state.betAmount) {
      console.error('Insufficient balance:', currentBalance, 'needed:', state.betAmount);
      set({ isBettingInProgress: false });
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
        // Update last bet timestamp
        set({ lastBetTimestamp: Date.now() });
        
        // Reload current bets and balance after successful bet placement
        await get().loadCurrentBets();
        await get().loadUserBalance();
        console.log('✅ Bet placed successfully');
      }

      return success;
    } catch (error) {
      console.error('❌ Error placing bet:', error);
      return false;
    } finally {
      // Always reset betting in progress
      set({ isBettingInProgress: false });
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
