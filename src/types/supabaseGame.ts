
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
}

export interface Bet {
  id: string;
  game_id: string;
  bet_type: 'color' | 'number';
  bet_value: string;
  amount: number;
  potential_win: number;
  is_winner?: boolean;
  actual_win?: number;
}

export interface GameState {
  currentGame: GameResult | null;
  timeRemaining: number;
  isAcceptingBets: boolean;
  gameHistory: GameResult[];
  currentBets: Bet[];
  betAmount: number;
  currentGameMode: GameMode;
  gameModesConfig: GameModeConfig[];
  isLoading: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  placeBet: (type: 'color' | 'number', value: string) => Promise<void>;
  setBetAmount: (amount: number) => void;
  setGameMode: (mode: GameMode) => void;
  loadGameHistory: () => Promise<void>;
  loadCurrentBets: () => Promise<void>;
}
