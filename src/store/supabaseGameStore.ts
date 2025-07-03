
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
      console.log('Initializing Supabase game store...');
      
      // First, try to create a demo game if none exists
      await get().createDemoGameIfNeeded();
      
      // Load initial data
      const activeGame = await GameService.loadActiveGame();
      const gameHistory = await GameService.loadGameHistory();
      
      set({ 
        currentGame: activeGame,
        gameHistory,
        isLoading: false 
      });

      // Load current user's bets if there's an active game
      if (activeGame) {
        await get().loadCurrentBets();
      }

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

      console.log('Supabase game store initialized successfully');
    } catch (error) {
      console.error('Supabase game store initialization error:', error);
      set({ isLoading: false });
    }
  },

  createDemoGameIfNeeded: async () => {
    try {
      // Check if there are any active games
      const { data: activeGames, error } = await supabase
        .from('games')
        .select('id')
        .eq('status', 'active')
        .limit(1);

      if (error) {
        console.error('Error checking for active games:', error);
        return;
      }

      // If no active games, create one
      if (!activeGames || activeGames.length === 0) {
        console.log('No active games found, creating demo game...');
        
        const gameNumber = Math.floor(Math.random() * 10000) + 1000;
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 60000); // 60 seconds from now

        const { error: createError } = await supabase
          .from('games')
          .insert({
            game_number: gameNumber,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: 'active',
            game_mode: 'quick'
          });

        if (createError) {
          console.error('Error creating demo game:', createError);
        } else {
          console.log('Demo game created successfully');
        }
      }
    } catch (error) {
      console.error('Error in createDemoGameIfNeeded:', error);
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
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        toast.error('Error fetching user data');
        return;
      }

      if (!userProfile || (userProfile.balance || 0) < betAmount) {
        toast.error('Insufficient balance');
        return;
      }

      const success = await BetService.placeBet(
        currentGame.id,
        session.user.id,
        type,
        value,
        betAmount,
        userProfile.balance || 0,
        currentGame.game_number
      );

      if (success) {
        // Refresh current bets
        await get().loadCurrentBets();
        toast.success(`Bet placed successfully on ${value}!`);
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
        await get().loadCurrentBets();
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
      } else {
        // Game ended, create a new one
        get().createDemoGameIfNeeded().then(() => {
          // Reload data after creating new game
          get().loadCurrentData();
        });
      }
    };

    updateTimer();
  }
}));

export default useSupabaseGameStore;
