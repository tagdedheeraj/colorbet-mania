
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import useSupabaseAuthStore from './supabaseAuthStore';

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

export const GAME_MODES: GameModeConfig[] = [
  {
    id: 'blitz',
    name: 'Blitz',
    duration: 30,
    description: 'Fast-paced 30 second rounds'
  },
  {
    id: 'quick',
    name: 'Quick',
    duration: 60,
    description: 'Standard 1 minute rounds'
  },
  {
    id: 'classic',
    name: 'Classic',
    duration: 180,
    description: 'Extended 3 minute rounds'
  },
  {
    id: 'extended',
    name: 'Extended',
    duration: 300,
    description: 'Long 5 minute strategy rounds'
  }
];

interface GameState {
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

const useSupabaseGameStore = create<GameState>((set, get) => ({
  currentGame: null,
  timeRemaining: 60,
  isAcceptingBets: false,
  gameHistory: [],
  currentBets: [],
  betAmount: 10,
  currentGameMode: 'quick',
  gameModesConfig: GAME_MODES,
  isLoading: true,

  initialize: async () => {
    try {
      // Load current active game
      const { data: activeGame } = await supabase
        .from('games')
        .select('*')
        .in('status', ['active', 'betting_closed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (activeGame) {
        // Type cast the database response to our GameResult interface
        const gameResult: GameResult = {
          id: activeGame.id,
          game_number: activeGame.game_number,
          result_color: (activeGame.result_color as ColorType) || 'red',
          result_number: (activeGame.result_number as NumberType) || 0,
          start_time: activeGame.start_time,
          end_time: activeGame.end_time,
          status: activeGame.status || 'active'
        };
        
        set({ currentGame: gameResult });
        
        // Calculate time remaining
        const endTime = new Date(activeGame.end_time).getTime();
        const now = Date.now();
        const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
        
        // Determine if bets are still being accepted (15% of total time)
        const totalDuration = GAME_MODES.find(m => m.id === activeGame.game_mode)?.duration || 60;
        const betsClosingTime = Math.max(10, Math.floor(totalDuration * 0.15));
        
        set({ 
          timeRemaining: timeLeft,
          isAcceptingBets: timeLeft > betsClosingTime && activeGame.status === 'active',
          currentGameMode: activeGame.game_mode as GameMode
        });
      }

      // Load game history and current bets
      await get().loadGameHistory();
      await get().loadCurrentBets();

      // Set up real-time subscriptions
      setupRealtimeSubscriptions();
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Game initialization error:', error);
      set({ isLoading: false });
    }
  },

  placeBet: async (type: 'color' | 'number', value: string) => {
    const { currentGame, betAmount, isAcceptingBets } = get();
    const { profile, session } = useSupabaseAuthStore.getState();

    if (!profile || !session) {
      toast.error('Please log in to place bets');
      return;
    }

    if (!currentGame) {
      toast.error('No active game');
      return;
    }

    if (!isAcceptingBets) {
      toast.error('Betting is closed for this round');
      return;
    }

    if (profile.balance < betAmount) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      // Calculate potential win
      let multiplier = 1;
      if (type === 'color') {
        multiplier = value === 'purple-red' ? 0.90 : 0.95;
      } else {
        multiplier = 9.0;
      }
      const potentialWin = betAmount * multiplier;

      // Place bet
      const { error: betError } = await supabase
        .from('bets')
        .insert({
          user_id: profile.id,
          game_id: currentGame.id,
          bet_type: type,
          bet_value: value,
          amount: betAmount,
          potential_win: potentialWin
        });

      if (betError) throw betError;

      // Update user balance
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: profile.balance - betAmount })
        .eq('id', profile.id);

      if (balanceError) throw balanceError;

      // Add bet transaction
      await supabase
        .from('transactions')
        .insert({
          user_id: profile.id,
          type: 'bet',
          amount: -betAmount,
          description: `Bet on ${value} - Game #${currentGame.game_number}`
        });

      // Refresh profile and current bets
      useSupabaseAuthStore.getState().refreshProfile();
      await get().loadCurrentBets();

      toast.success(`Bet placed on ${value}`);
    } catch (error) {
      console.error('Bet placement error:', error);
      toast.error('Failed to place bet');
    }
  },

  setBetAmount: (amount: number) => {
    set({ betAmount: amount });
  },

  setGameMode: (mode: GameMode) => {
    set({ currentGameMode: mode });
    toast.info(`Game mode changed to ${GAME_MODES.find(m => m.id === mode)?.name}`);
  },

  loadGameHistory: async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'completed')
        .order('game_number', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Type cast the database response to our GameResult interface
      const gameResults: GameResult[] = (data || []).map(game => ({
        id: game.id,
        game_number: game.game_number,
        result_color: (game.result_color as ColorType) || 'red',
        result_number: (game.result_number as NumberType) || 0,
        start_time: game.start_time,
        end_time: game.end_time,
        status: game.status || 'completed'
      }));
      
      set({ gameHistory: gameResults });
    } catch (error) {
      console.error('Error loading game history:', error);
    }
  },

  loadCurrentBets: async () => {
    const { currentGame } = get();
    const { profile } = useSupabaseAuthStore.getState();
    
    if (!currentGame || !profile) return;

    try {
      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('game_id', currentGame.id)
        .eq('user_id', profile.id);

      if (error) throw error;
      
      // Type cast the database response to our Bet interface
      const bets: Bet[] = (data || []).map(bet => ({
        id: bet.id,
        game_id: bet.game_id || '',
        bet_type: bet.bet_type as 'color' | 'number',
        bet_value: bet.bet_value,
        amount: bet.amount,
        potential_win: bet.potential_win,
        is_winner: bet.is_winner || false,
        actual_win: bet.actual_win || 0
      }));
      
      set({ currentBets: bets });
    } catch (error) {
      console.error('Error loading current bets:', error);
    }
  }
}));

// Set up real-time subscriptions
const setupRealtimeSubscriptions = () => {
  // Subscribe to game updates
  supabase
    .channel('games')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'games' },
      (payload) => {
        console.log('Game update:', payload);
        const { initialize } = useSupabaseGameStore.getState();
        initialize();
      }
    )
    .subscribe();

  // Subscribe to bet updates
  supabase
    .channel('bets')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'bets' },
      (payload) => {
        console.log('Bet update:', payload);
        const { loadCurrentBets } = useSupabaseGameStore.getState();
        loadCurrentBets();
      }
    )
    .subscribe();
};

export default useSupabaseGameStore;
