
export type ColorType = 'red' | 'green' | 'purple-red';
export type NumberType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface Bet {
  id: string;
  amount: number;
  type: 'color' | 'number';
  value: ColorType | NumberType;
  potentialWin: number;
  timestamp: number;
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
}

export interface User {
  id: string;
  username: string;
  balance: number;
  isLoggedIn: boolean;
}

export interface WinLossPopup {
  show: boolean;
  isWin: boolean;
  amount: number;
  message: string;
}
