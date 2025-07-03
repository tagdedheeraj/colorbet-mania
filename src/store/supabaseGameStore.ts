
import { create } from 'zustand';
import { GameState } from '@/types/supabaseGame';
import { GameService } from '@/services/gameService';
import { BetService } from '@/services/betService';
import { GameRealtimeService } from '@/services/gameRealtimeService';
import { GAME_MODES } from '@/config/gameModes';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const useSupabaseGameStore = create<GameState>((set, get) => ({
  currentGame: null,
  timeRemaining: 0,
  isAcceptingBets: false,
  gameHistory: [],
  currentBets: [],
  betAmount: 100,
  currentGameMode: 'quick',
  gameModesConfig: GAME_MODES,
  isLoading: true,

  initialize: async () => {
    set({ isLoading: true });
    try {
      console.log('Initializing game store...');
      
      // Load initial data
      const activeGame = await GameService.loadActiveGame();
      const gameHistory = await GameService.loadGameHistory();
      
      set({ 
        currentGame: activeGame,
        gameHistory,
        isLoading: false 
      });

      // Setup real-time subscriptions
      const realtimeService = GameRealtimeService.getInstance();
      
      realtimeService.setupGameSubscription(() => {
        console.log('Game update received, refreshing data...');
        get().loadCurrentData();
      });

      realtimeService.setupBetSubscription(() => {
        console.log('Bet update received, refreshing bets...');
        get().loadCurrentBets();
      });

      // Start timer for current game
      if (activeGame) {
        get().startGameTimer();
      }

      console.log('Game store initialized successfully');
    } catch (error) {
      console.error('Game store initialization error:', error);
      set({ isLoading: false });
    }
  },

  placeBet: async (type: 'color' | 'number', value: string) => {
    const { currentGame, betAmount } = get();
    
    if (!currentGame) {
      toast.error('No active game');
      return;
    }

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error('Please log in to place bets');
        return;
      }

      // Get user profile for balance
      const { data: userProfile } = await supabase
        .from('users')
        .select('balance')
        .eq('id', session.user.id)
        .single();

      if (!userProfile || userProfile.balance < betAmount) {
        toast.error('Insufficient balance');
        return;
      }

      const success = await BetService.placeBet(
        currentGame.id,
        session.user.id,
        type,
        value,
        betAmount,
        userProfile.balance,
        currentGame.game_number
      );

      if (success) {
        // Refresh current bets and user profile
        await get().loadCurrentBets();
      }
    } catch (error) {
      console.error('Bet placement error:', error);
      toast.error('Failed to place bet');
    }
  },

  setBetAmount: (amount: number) => {
    set({ betAmount: Math.max(10, amount) });
  },

  setGameMode: (mode) => {
    set({ currentGameMode: mode });
  },

  loadGameHistory: async () => {
    try {
      const gameHistory = await GameService.loadGameHistory();
      set({ gameHistory });
    } catch (error) {
      console.error('Error loading game history:', error);
    }
  },

  loadCurrentBets: async () => {
    const { currentGame } = get();
    if (!currentGame) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const currentBets = await GameService.loadCurrentBets(currentGame.id, session.user.id);
      set({ currentBets });
    } catch (error) {
      console.error('Error loading current bets:', error);
    }
  },

  // Helper methods
  loadCurrentData: async () => {
    try {
      const activeGame = await GameService.loadActiveGame();
      const gameHistory = await GameService.loadGameHistory();
      
      set({ 
        currentGame: activeGame,
        gameHistory 
      });

      if (activeGame) {
        get().startGameTimer();
      }
    } catch (error) {
      console.error('Error loading current data:', error);
    }
  },

  startGameTimer: () => {
    const { currentGame, currentGameMode } = get();
    if (!currentGame) return;

    const updateTimer = () => {
      const timeRemaining = GameService.calculateTimeRemaining(currentGame.end_time);
      const isAcceptingBets = GameService.isAcceptingBets(timeRemaining, currentGameMode, currentGame.status);
      
      set({ 
        timeRemaining,
        isAcceptingBets 
      });

      if (timeRemaining > 0) {
        setTimeout(updateTimer, 1000);
      }
    };

    updateTimer();
  }
}));

export default useSupabaseGameStore;
