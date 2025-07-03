
import { create } from 'zustand';
import { GameState, Bet, GameResult, ColorType, NumberType, WinLossPopup, GameMode, GameModeConfig } from '../types/game';
import { toast } from "sonner";
import useAuthStore from './authStore';

// Game mode configurations
export const GAME_MODES: GameModeConfig[] = [
  {
    id: 'blitz',
    name: 'Blitz',
    duration: 30, // 30 seconds
    description: 'Fast-paced 30 second rounds'
  },
  {
    id: 'quick',
    name: 'Quick',
    duration: 60, // 1 minute
    description: 'Standard 1 minute rounds'
  },
  {
    id: 'classic',
    name: 'Classic',
    duration: 180, // 3 minutes
    description: 'Extended 3 minute rounds'
  },
  {
    id: 'extended',
    name: 'Extended',
    duration: 300, // 5 minutes
    description: 'Long 5 minute strategy rounds'
  }
];

const DEFAULT_GAME_MODE: GameMode = 'quick';
const RESULTS_HISTORY_COUNT = 10;

interface GameStoreState extends GameState {
  winLossPopup: WinLossPopup;
  placeBet: (type: 'color' | 'number', value: ColorType | NumberType) => void;
  setBetAmount: (amount: number) => void;
  startNewGame: (mode?: GameMode) => void;
  updateTimer: () => void;
  resetBets: () => void;
  determineResult: () => GameResult;
  processResults: (result: GameResult) => void;
  showWinLossPopup: (isWin: boolean, amount: number, message: string) => void;
  hideWinLossPopup: () => void;
  setGameMode: (mode: GameMode) => void;
  gameModesConfig: GameModeConfig[];
}

let timerInterval: NodeJS.Timeout | null = null;

const generateGameId = (): string => {
  const lastGameId = localStorage.getItem('last-game-id');
  const nextId = lastGameId ? parseInt(lastGameId) + 1 : 9001;
  localStorage.setItem('last-game-id', nextId.toString());
  return nextId.toString();
};

const getMultiplier = (type: 'color' | 'number', value: ColorType | NumberType): number => {
  if (type === 'color') {
    if (value === 'purple-red') return 0.90;
    return 0.95; // for red and green
  } else {
    return 9.0; // number bet multiplier
  }
};

const useGameStore = create<GameStoreState>((set, get) => ({
  currentGameId: generateGameId(),
  timeRemaining: GAME_MODES.find(mode => mode.id === DEFAULT_GAME_MODE)?.duration || 60,
  isAcceptingBets: true,
  lastResults: [],
  currentBets: [],
  betAmount: 10,
  currentGameMode: DEFAULT_GAME_MODE,
  gameModesConfig: GAME_MODES,
  winLossPopup: {
    show: false,
    isWin: false,
    amount: 0,
    message: ''
  },

  placeBet: (type: 'color' | 'number', value: ColorType | NumberType) => {
    const { betAmount, isAcceptingBets, currentBets, currentGameId } = get();
    const authStore = useAuthStore();
    const user = authStore.user;

    if (!user) {
      toast.error("Please log in to place bets");
      authStore.setAuthModalOpen(true);
      return;
    }

    if (!isAcceptingBets) {
      toast.error("Betting closed for this round");
      return;
    }

    if (user.balance < betAmount) {
      toast.error("Insufficient balance");
      return;
    }

    const existingBetIndex = currentBets.findIndex(
      bet => bet.type === type && bet.value === value
    );

    if (existingBetIndex !== -1) {
      toast.error("You already have this bet placed");
      return;
    }

    const multiplier = getMultiplier(type, value);
    const potentialWin = betAmount * multiplier;

    const newBet: Bet = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      gameId: currentGameId,
      amount: betAmount,
      type,
      value,
      potentialWin,
      timestamp: Date.now()
    };

    authStore.updateBalance(-betAmount);
    
    set(state => ({
      currentBets: [...state.currentBets, newBet]
    }));

    toast.success(`Bet placed on ${value}`);
  },

  setBetAmount: (amount: number) => {
    set({ betAmount: amount });
  },

  setGameMode: (mode: GameMode) => {
    const modeConfig = GAME_MODES.find(m => m.id === mode);
    if (modeConfig) {
      set({ currentGameMode: mode });
      
      // Only restart the game if a game is in progress
      if (timerInterval) {
        get().startNewGame(mode);
      }
      
      toast.info(`Game mode changed to ${modeConfig.name}`);
    }
  },

  startNewGame: (mode?: GameMode) => {
    const newGameId = generateGameId();
    clearInterval(timerInterval as NodeJS.Timeout);
    
    // Use provided mode or current mode
    const gameMode = mode || get().currentGameMode;
    const modeConfig = GAME_MODES.find(m => m.id === gameMode);
    const gameDuration = modeConfig?.duration || 60;
    
    timerInterval = setInterval(() => {
      get().updateTimer();
    }, 1000);

    set({
      currentGameId: newGameId,
      timeRemaining: gameDuration,
      isAcceptingBets: true,
      currentBets: [],
      currentGameMode: gameMode
    });
    
    toast.info(`Game #${newGameId} started in ${modeConfig?.name} mode! Place your bets.`);
  },

  updateTimer: () => {
    const { timeRemaining, isAcceptingBets, currentGameMode } = get();
    
    if (timeRemaining <= 0) {
      clearInterval(timerInterval as NodeJS.Timeout);
      const result = get().determineResult();
      get().processResults(result);
      
      setTimeout(() => {
        get().startNewGame();
      }, 3000);
      return;
    }

    // Close betting at 15% of the total time remaining
    const modeConfig = GAME_MODES.find(m => m.id === currentGameMode);
    const totalDuration = modeConfig?.duration || 60;
    const betsClosingTime = Math.max(10, Math.floor(totalDuration * 0.15));
    
    if (timeRemaining <= betsClosingTime && isAcceptingBets) {
      set({ isAcceptingBets: false });
      toast.info("Betting closed for this round!");
    }

    set(state => ({ timeRemaining: state.timeRemaining - 1 }));
  },

  resetBets: () => {
    set({ currentBets: [] });
  },

  determineResult: () => {
    const colors: ColorType[] = ['red', 'green', 'purple-red'];
    const randomColorIndex = Math.floor(Math.random() * 3);
    const resultColor = colors[randomColorIndex];
    
    const resultNumber = Math.floor(Math.random() * 10) as NumberType;
    
    const result: GameResult = {
      id: `result-${Date.now()}`,
      gameId: get().currentGameId,
      resultColor,
      resultNumber,
      timestamp: Date.now()
    };
    
    return result;
  },

  processResults: (result: GameResult) => {
    const { currentBets, lastResults } = get();
    let totalWinAmount = 0;
    let isWin = false;
    let userWonAnyBet = false;
    
    const authStore = useAuthStore();
    const user = authStore.user;
    
    const processedBets = currentBets.map(bet => {
      let betWon = false;

      if (bet.type === 'color' && bet.value === result.resultColor) {
        betWon = true;
      } else if (bet.type === 'number') {
        if (result.resultNumber !== 0 && bet.value === result.resultNumber) {
          betWon = true;
        }
      }

      const updatedBet = { ...bet, won: betWon };

      if (betWon) {
        userWonAnyBet = true;
        totalWinAmount += bet.potentialWin;
        authStore.updateBalance(bet.potentialWin);
      }
      
      return updatedBet;
    });
    
    if (user) {
      const userBets = user.bets || [];
      const updatedUserBets = [...userBets, ...processedBets];
      const updatedUser = {
        ...user,
        bets: updatedUserBets
      };
      authStore.user = updatedUser;
      localStorage.setItem('current-user', JSON.stringify(updatedUser));
    }
    
    const updatedResults = [result, ...lastResults].slice(0, RESULTS_HISTORY_COUNT);
    set({ lastResults: updatedResults });
    
    if (currentBets.length > 0) {
      if (userWonAnyBet) {
        get().showWinLossPopup(true, totalWinAmount, `Congratulations! You won ${totalWinAmount.toFixed(2)} coins!`);
      } else {
        get().showWinLossPopup(false, 0, "Better luck next time!");
      }
    }
  },
  
  showWinLossPopup: (isWin: boolean, amount: number, message: string) => {
    set({
      winLossPopup: {
        show: true,
        isWin,
        amount,
        message
      }
    });
    
    setTimeout(() => {
      get().hideWinLossPopup();
    }, 5000);
  },
  
  hideWinLossPopup: () => {
    set({
      winLossPopup: {
        show: false,
        isWin: false,
        amount: 0,
        message: ''
      }
    });
  }
}));

if (typeof window !== 'undefined') {
  setTimeout(() => {
    useGameStore.getState().startNewGame();
  }, 500);
}

export default useGameStore;
