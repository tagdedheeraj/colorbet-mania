
export type ColorType = 'red' | 'green' | 'purple-red';
export type NumberType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type GameMode = 'blitz' | 'quick' | 'classic' | 'extended';

export interface GameModeConfig {
  id: GameMode;
  name: string;
  duration: number;
  description: string;
}

export interface Bet {
  id: string;
  gameId?: string;
  amount: number;
  type: 'color' | 'number';
  value: ColorType | NumberType;
  potentialWin: number;
  timestamp: number;
  won?: boolean;
}

export interface GameResult {
  id: string;
  gameId: string;
  resultColor: ColorType;
  resultNumber: NumberType;
  timestamp: number;
}

export interface GameState {
  currentGameId: string;
  timeRemaining: number;
  isAcceptingBets: boolean;
  lastResults: GameResult[];
  currentBets: Bet[];
  betAmount: number;
  currentGameMode: GameMode;
}

export interface UserProfile {
  name?: string;
  email?: string;
  mobile?: string;
  referralCode?: string;
  referredBy?: string;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'bet' | 'win' | 'referral' | 'signup';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  description?: string;
}

export interface User {
  id: string;
  username: string;
  balance: number;
  isLoggedIn: boolean;
  bets?: Bet[];
  profile?: UserProfile;
  transactions?: Transaction[];
}

export interface WinLossPopup {
  show: boolean;
  isWin: boolean;
  amount: number;
  message: string;
}
