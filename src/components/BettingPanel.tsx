
import React, { useEffect } from 'react';
import { useGameState } from '@/store/gameState';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { ColorType, NumberType } from '@/types/supabaseGame';
import { toast } from "sonner";
import BetAmountControl from './betting/BetAmountControl';
import ColorBetting from './betting/ColorBetting';
import NumberBetting from './betting/NumberBetting';
import BettingStatusMessage from './betting/BettingStatusMessage';

const BettingPanel: React.FC = () => {
  const { 
    betAmount, 
    setBetAmount, 
    placeBet, 
    isAcceptingBets, 
    timeRemaining, 
    currentGame,
    isLoading: gameLoading,
    userBalance,
    loadUserBalance
  } = useGameState();
  
  const { user, isAuthenticated, isLoading: authLoading } = useSupabaseAuthStore();
  
  // Load user balance when component mounts or user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserBalance();
    }
  }, [isAuthenticated, user, loadUserBalance]);
  
  const handleColorBet = async (color: ColorType) => {
    console.log('Color bet clicked:', color);
    
    if (!isAuthenticated) {
      toast.error('Please log in to place bets');
      return;
    }
    if (!currentGame) {
      toast.error('No active game found');
      return;
    }
    if (!isAcceptingBets) {
      toast.error(`Betting closed! Next game in ${timeRemaining}s`);
      return;
    }
    if (userBalance < betAmount) {
      toast.error(`Insufficient balance! You have ₹${userBalance}, need ₹${betAmount}`);
      return;
    }
    
    console.log('Placing color bet:', color, 'amount:', betAmount);
    try {
      const success = await placeBet('color', color);
      
      if (success) {
        toast.success(`Bet placed: ₹${betAmount} on ${color}`);
      } else {
        toast.error('Failed to place bet');
      }
    } catch (error) {
      console.error('Error placing bet:', error);
      toast.error('Failed to place bet');
    }
  };
  
  const handleNumberBet = async (number: NumberType) => {
    console.log('Number bet clicked:', number);
    
    if (!isAuthenticated) {
      toast.error('Please log in to place bets');
      return;
    }
    if (!currentGame) {
      toast.error('No active game found');
      return;
    }
    if (!isAcceptingBets) {
      toast.error(`Betting closed! Next game in ${timeRemaining}s`);
      return;
    }
    if (userBalance < betAmount) {
      toast.error(`Insufficient balance! You have ₹${userBalance}, need ₹${betAmount}`);
      return;
    }
    
    console.log('Placing number bet:', number, 'amount:', betAmount);
    try {
      const success = await placeBet('number', number.toString());
      
      if (success) {
        toast.success(`Bet placed: ₹${betAmount} on number ${number}`);
      } else {
        toast.error('Failed to place bet');
      }
    } catch (error) {
      console.error('Error placing bet:', error);
      toast.error('Failed to place bet');
    }
  };

  const isSystemLoading = authLoading || gameLoading;
  const canBet = isAuthenticated && !isSystemLoading && currentGame && isAcceptingBets && userBalance >= betAmount;

  console.log('Betting panel state:', {
    isAuthenticated,
    isSystemLoading,
    currentGame: currentGame?.id,
    gameNumber: currentGame?.game_number,
    isAcceptingBets,
    userBalance,
    betAmount,
    canBet,
    timeRemaining
  });

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6 space-y-6">
      {/* Balance Display */}
      <div className="text-center">
        <p className="text-sm text-gray-400">Your Balance</p>
        <p className="text-2xl font-bold text-white">₹{userBalance.toFixed(2)}</p>
      </div>
      
      <BetAmountControl
        betAmount={betAmount}
        setBetAmount={setBetAmount}
        userBalance={userBalance}
        isAuthenticated={isAuthenticated}
        canBet={canBet}
      />
      
      <ColorBetting
        onColorBet={handleColorBet}
        canBet={canBet}
        userBalance={userBalance}
        betAmount={betAmount}
      />
      
      <NumberBetting
        onNumberBet={handleNumberBet}
        canBet={canBet}
        userBalance={userBalance}
        betAmount={betAmount}
      />
      
      <BettingStatusMessage
        isAuthenticated={isAuthenticated}
        isSystemLoading={isSystemLoading}
        currentGame={currentGame}
      />
    </div>
  );
};

export default BettingPanel;
