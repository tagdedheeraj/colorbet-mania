
export interface LiveGameStats {
  activeGame: any;
  totalBets: number;
  totalBetAmount: number;
  colorBets: { [key: string]: { count: number; amount: number } };
  numberBets: { [key: string]: { count: number; amount: number } };
  activePlayers: number;
}

export interface DatabaseResponse {
  success: boolean;
  message: string;
  result_number?: number;
  result_color?: string;
  was_manual?: boolean;
}
