
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
  period_number: number;
  result_color: ColorType;
  result_number: NumberType;
  start_time: string;
  end_time: string;
  status: string;
  game_mode_type: string;
  created_at: string;
}

export interface Bet {
  id: string;
  user_id: string;
  period_number: number;
  bet_type: 'color' | 'number';
  bet_value: string;
  amount: number;
  profit: number;
  status: string;
  created_at: string;
}

// Extended bet type that includes game period data for history display
export interface BetWithGame extends Bet {
  game_period: GamePeriod;
}

export interface GameState {
  currentGame: GamePeriod | null;
  timeRemaining: number;
  isAcceptingBets: boolean;
  gameHistory: GamePeriod[];
  currentBets: Bet[];
  betAmount: number;
  currentGameMode: GameMode;
  gameModesConfig: GameModeConfig[];
  isLoading: boolean;
  showResultPopup?: boolean;
  lastCompletedGame?: GamePeriod | null;
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

export interface GamePeriod {
  id: string;
  period_number: number;
  start_time: string;
  end_time: string | null;
  status: string;
  result_color: string | null;
  result_number: number | null;
  game_mode_type: string;
  created_at: string;
  admin_set_result_number: number | null;
  admin_set_result_color: string | null;
  is_result_locked: boolean;
}

// Legacy aliases for backward compatibility
export interface SupabaseGame extends GamePeriod {}

export interface SupabaseBet extends Bet {}

export interface UserProfile {
  id: string;
  email: string;
  balance: number;
  created_at: string;
  updated_at: string;
}
