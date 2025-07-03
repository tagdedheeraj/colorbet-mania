
import { GAME_MODES } from '@/config/gameModes';

export interface GameState {
  currentGame: SupabaseGame | null;
  timeRemaining: number;
  isAcceptingBets: boolean;
  gameHistory: SupabaseGame[];
  currentBets: SupabaseBet[];
  betAmount: number;
  currentGameMode: string;
  gameModesConfig: typeof GAME_MODES;
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  placeBet: (type: 'color' | 'number', value: string) => Promise<void>;
  setBetAmount: (amount: number) => void;
  setGameMode: (mode: string) => void;
  loadGameHistory: () => Promise<void>;
  loadCurrentBets: () => Promise<void>;
  loadCurrentData: () => Promise<void>;
  startGameTimer: () => void;
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
}
