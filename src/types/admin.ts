
// Admin-specific types to avoid conflicts with game types
export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: string;
  balance: number; // Make balance required
  created_at: string;
  updated_at: string;
}

export interface AdminBet {
  id: string;
  user_id: string;
  period_number: number;
  bet_type: 'color' | 'number';
  bet_value: string;
  amount: number;
  profit: number;
  status: string;
  created_at: string;
  // Additional properties for admin view
  profiles?: { username: string; email: string };
  // Add missing properties for compatibility
  is_winner?: boolean;
  actual_win?: number;
}

export interface AdminGame {
  id: string;
  period_number: number;
  status: string;
  game_mode_type: string;
  result_number?: number;
  result_color?: string;
  created_at: string;
  start_time: string;
  end_time?: string;
  // Compatibility properties
  game_number: number;
  game_mode: string;
}

export interface AdminTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
  balance_before: number;
  balance_after: number;
  reference_id?: string;
}
