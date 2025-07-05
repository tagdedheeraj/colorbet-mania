
import { create } from 'zustand';
import { GameMode, SupabaseGame } from '@/types/supabaseGame';
import { GAME_MODES } from '@/config/gameModes';

export interface GameStateSlice {
  currentGame: SupabaseGame | null;
  timeRemaining: number;
  isAcceptingBets: boolean;
  gameHistory: SupabaseGame[];
  currentBets: any[];
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
  setCurrentGameMode: (mode: GameMode) => void;
  setIsLoading: (loading: boolean) => void;
  setShowResultPopup: (show: boolean) => void;
  setLastCompletedGame: (game: SupabaseGame | null) => void;
  setUserGameResults: (results: any[]) => void;
}

export const useGameState = create<GameStateSlice>((set) => ({
  currentGame: null,
  timeRemaining: 0,
  isAcceptingBets: false,
  gameHistory: [],
  currentBets: [],
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
  setCurrentGameMode: (mode) => set({ currentGameMode: mode }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setShowResultPopup: (show) => set({ showResultPopup: show }),
  setLastCompletedGame: (game) => set({ lastCompletedGame: game }),
  setUserGameResults: (results) => set({ userGameResults: results }),
}));
