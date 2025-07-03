
import { create } from 'zustand';
import { toast } from 'sonner';
import useSupabaseAuthStore from './supabaseAuthStore';
import { GameState, GameMode } from '@/types/supabaseGame';
import { GAME_MODES } from '@/config/gameModes';
import { GameService } from '@/services/gameService';
import { BetService } from '@/services/betService';
import { GameRealtimeService } from '@/services/gameRealtimeService';

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
      console.log('Initializing game store...');
      
      // Load current active game
      const activeGame = await GameService.loadActiveGame();
      
      if (activeGame) {
        console.log('Found active game:', activeGame.game_number);
        set({ currentGame: activeGame });
        
        // Calculate time remaining
        const timeLeft = GameService.calculateTimeRemaining(activeGame.end_time);
        const isAccepting = GameService.isAcceptingBets(
          timeLeft, 
          activeGame.status as GameMode, 
          activeGame.status
        );
        
        set({ 
          timeRemaining: timeLeft,
          isAcceptingBets: isAccepting,
          currentGameMode: (activeGame.status as GameMode) || 'quick'
        });
      } else {
        console.log('No active game found');
      }

      // Load game history and current bets
      await get().loadGameHistory();
      await get().loadCurrentBets();

      // Set up real-time subscriptions
      const realtimeService = GameRealtimeService.getInstance();
      realtimeService.setupGameSubscription(() => {
        get().initialize();
      });
      realtimeService.setupBetSubscription(() => {
        get().loadCurrentBets();
      });
      
      set({ isLoading: false });
      console.log('Game store initialized successfully');
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

    const success = await BetService.placeBet(
      currentGame.id,
      profile.id,
      type,
      value,
      betAmount,
      profile.balance,
      currentGame.game_number
    );

    if (success) {
      // Refresh profile and current bets
      useSupabaseAuthStore.getState().refreshProfile();
      await get().loadCurrentBets();
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
    const gameHistory = await GameService.loadGameHistory();
    set({ gameHistory });
  },

  loadCurrentBets: async () => {
    const { currentGame } = get();
    const { profile } = useSupabaseAuthStore.getState();
    
    if (!currentGame || !profile) return;

    const currentBets = await GameService.loadCurrentBets(currentGame.id, profile.id);
    set({ currentBets });
  }
}));

export default useSupabaseGameStore;
