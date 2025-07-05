
import { BetManagementService } from '@/services/betManagementService';
import { useGameState } from './gameState';

export const useBettingOperations = () => {
  const {
    currentGame,
    betAmount,
    isAcceptingBets,
    setCurrentBets,
    setBetAmount
  } = useGameState();

  const placeBet = async (type: 'color' | 'number', value: string) => {
    console.log('Placing bet:', { type, value, betAmount, isAcceptingBets, currentGame: currentGame?.id });
    
    if (!isAcceptingBets) {
      console.error('Betting is currently closed');
      return false;
    }
    
    const success = await BetManagementService.placeBet(
      currentGame,
      betAmount,
      type,
      value
    );

    if (success) {
      await loadCurrentBets();
    }

    return success;
  };

  const updateBetAmount = (amount: number) => {
    useGameState.getState().setCurrentBets([]);
    setBetAmount(amount);
  };

  const setGameMode = (mode: any) => {
    console.log('Setting game mode to:', mode);
    useGameState.getState().setCurrentGameMode(mode);
    
    // If no active game, create new one with selected mode
    if (!currentGame) {
      setTimeout(() => {
        // This will be handled by game operations
      }, 500);
    }
  };

  const loadCurrentBets = async () => {
    if (!currentGame) return;

    try {
      const currentBets = await BetManagementService.loadCurrentBets(
        currentGame.id,
        currentGame.id
      );
      console.log('Current bets loaded:', currentBets.length);
      setCurrentBets(currentBets);
    } catch (error) {
      console.error('Error loading current bets:', error);
    }
  };

  return {
    placeBet,
    setBetAmount: updateBetAmount,
    setGameMode,
    loadCurrentBets
  };
};
