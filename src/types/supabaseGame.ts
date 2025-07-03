import { GAME_MODES } from '@/config/gameModes';

export type ColorType = 'red' | 'green' | 'purple-red';
export type NumberType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type GameMode = 'blitz' | 'quick' | 'classic' | 'extended';

export interface GameModeConfig {
  id: GameMode;
  name: string;
  duration: number;
  description: string;
}

export interface GameResult {
  id: string;
  game_number: number;
  result_color: ColorType;
  result_number: NumberType;
  start_time: string;
  end_time: string;
  status: string;
  game_mode: string;
  created_at: string;
}

export interface Bet {
  id: string;
  game_id: string;
  user_id: string;
  bet_type: 'color' | 'number';
  bet_value: string;
  amount: number;
  potential_win: number;
  is_winner: boolean;
  actual_win: number;
  created_at: string;
}

export interface GameState {
  currentGame: SupabaseGame | null;
  timeRemaining: number;
  isAcceptingBets: boolean;
  gameHistory: SupabaseGame[];
  currentBets: SupabaseBet[];
  betAmount: number;
  currentGameMode: GameMode;
  gameModesConfig: GameModeConfig[];
  isLoading: boolean;
  showResultPopup?: boolean;
  lastCompletedGame?: SupabaseGame | null;
  userGameResults?: any[];

  // Actions
  initialize: () => Promise<void>;
  createDemoGameIfNeeded: () => Promise<void>;
  placeBet: (type: 'color' | 'number', value: string) => Promise<boolean>;
  setBetAmount: (amount: number) => void;
  setGameMode: (mode: GameMode) => void;
  loadGameHistory: () => Promise<void>;
  loadCurrentBets: () => Promise<void>;
  loadUserGameResults?: (userId: string) => Promise<void>;
  loadCurrentData: () => Promise<void>;
  startGameTimer: () => void;
  closeResultPopup?: () => void;
}

export interface SupabaseGame {
  id: string;
  game_number: number;
  start_time: string;
  end_time: string;
  status: string;
  result_color: string | null;
  result_number: number | null;
  game_mode: string;
  created_at: string;
}

export interface SupabaseBet {
  id: string;
  game_id: string;
  user_id: string;
  bet_type: string;
  bet_value: string;
  amount: number;
  potential_win: number;
  is_winner: boolean | null;
  actual_win: number | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  balance: number;
  referral_code: string | null;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
  full_name?: string;
  phone?: string;
}
