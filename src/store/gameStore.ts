
import { create } from 'zustand';
import { GameState, Bet, GameResult, ColorType, NumberType, WinLossPopup } from '../types/game';
import { toast } from "sonner";
import useAuthStore from './authStore';

const GAME_DURATION = 60; // 60 seconds or 1 minute
const RESULTS_HISTORY_COUNT = 10;

interface GameStoreState extends GameState {
  winLossPopup: WinLossPopup;
  placeBet: (type: 'color' | 'number', value: ColorType | NumberType) => void;
  setBetAmount: (amount: number) => void;
  startNewGame: () => void;
  updateTimer: () => void;
  resetBets: () => void;
  determineResult: () => GameResult;
  processResults: (result: GameResult) => void;
  showWinLossPopup: (isWin: boolean, amount: number, message: string) => void;
  hideWinLossPopup: () => void;
}

let timerInterval: NodeJS.Timeout | null = null;

const generateGameId = (): string => {
  // Generate a game ID starting from 9001 and incrementing
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
  timeRemaining: GAME_DURATION,
  isAcceptingBets: true,
  lastResults: [],
  currentBets: [],
  betAmount: 10,
  winLossPopup: {
    show: false,
    isWin: false,
    amount: 0,
    message: ''
  },

  placeBet: (type: 'color' | 'number', value: ColorType | NumberType) => {
    const { betAmount, isAcceptingBets, currentBets, currentGameId } = get();
    const user = useAuthStore.getState().user;

    if (!user) {
      toast.error("Please log in to place bets");
      useAuthStore.getState().setAuthModalOpen(true);
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

    // Check if user already has this exact bet
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

    // Update user's balance
    useAuthStore.getState().updateBalance(-betAmount);
    
    // Add bet to current bets
    set(state => ({
      currentBets: [...state.currentBets, newBet]
    }));

    toast.success(`Bet placed on ${value}`);
  },

  setBetAmount: (amount: number) => {
    set({ betAmount: amount });
  },

  startNewGame: () => {
    const newGameId = generateGameId();
    clearInterval(timerInterval as NodeJS.Timeout);
    
    timerInterval = setInterval(() => {
      get().updateTimer();
    }, 1000);

    set({
      currentGameId: newGameId,
      timeRemaining: GAME_DURATION,
      isAcceptingBets: true,
      currentBets: []
    });
    
    toast.info(`Game #${newGameId} started! Place your bets.`);
  },

  updateTimer: () => {
    const { timeRemaining, isAcceptingBets } = get();
    
    if (timeRemaining <= 0) {
      // Game ended, process results
      clearInterval(timerInterval as NodeJS.Timeout);
      const result = get().determineResult();
      get().processResults(result);
      
      // Start a new game after a short delay
      setTimeout(() => {
        get().startNewGame();
      }, 3000);
      return;
    }

    // Stop accepting bets in the last 10 seconds
    if (timeRemaining <= 10 && isAcceptingBets) {
      set({ isAcceptingBets: false });
      toast.info("Betting closed for this round!");
    }

    set(state => ({ timeRemaining: state.timeRemaining - 1 }));
  },

  resetBets: () => {
    set({ currentBets: [] });
  },

  determineResult: () => {
    // Generate random result
    const colors: ColorType[] = ['red', 'green', 'purple-red'];
    const randomColorIndex = Math.floor(Math.random() * 3);
    const resultColor = colors[randomColorIndex];
    
    // Generate random number 0-9
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
    
    // Updated user bets array
    const authStore = useAuthStore.getState();
    const user = authStore.user;
    let userBets = user?.bets || [];
    
    // Process each bet
    const processedBets = currentBets.map(bet => {
      let betWon = false;

      if (bet.type === 'color' && bet.value === result.resultColor) {
        betWon = true;
      } else if (bet.type === 'number') {
        // Numbers 1-9 win if matching, 0 always loses
        if (result.resultNumber !== 0 && bet.value === result.resultNumber) {
          betWon = true;
        }
      }

      // Add won status to the bet
      const updatedBet = { ...bet, won: betWon };

      if (betWon) {
        userWonAnyBet = true;
        totalWinAmount += bet.potentialWin;
        useAuthStore.getState().updateBalance(bet.potentialWin);
      }
      
      return updatedBet;
    });
    
    // Save bets to user history if user is logged in
    if (user) {
      // Add current game's bets to user's bet history
      const updatedUserBets = [...userBets, ...processedBets];
      
      // Update user with new bets
      authStore.updateUser({
        ...user,
        bets: updatedUserBets
      });
    }
    
    // Update last results
    const updatedResults = [result, ...lastResults].slice(0, RESULTS_HISTORY_COUNT);
    set({ lastResults: updatedResults });
    
    // Show win/loss popup
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
    
    // Auto-hide popup after 5 seconds
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

// Initialize game on first load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useGameStore.getState().startNewGame();
  }, 500);
}

export default useGameStore;
