
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
    console.log('🎨 Color bet clicked:', color);
    
    if (!isAuthenticated) {
      toast.error('Please log in to place bets');
      return;
    }
    if (!currentGame) {
      toast.error('No active game found');
      return;
    }
    if (!isAcceptingBets) {
      toast.error(`Betting closed! ${timeRemaining > 0 ? `Next game in ${timeRemaining}s` : 'Please wait for next game'}`);
      return;
    }
    if (userBalance < betAmount) {
      toast.error(`Insufficient balance! You have ₹${userBalance.toFixed(2)}, need ₹${betAmount}`);
      return;
    }
    
    console.log('✅ Placing color bet:', { color, amount: betAmount, game: currentGame.game_number });
    try {
      const success = await placeBet('color', color);
      
      if (success) {
        toast.success(`Bet placed: ₹${betAmount} on ${color}`, {
          description: `Game #${currentGame.game_number} • Time remaining: ${timeRemaining}s`
        });
      } else {
        toast.error('Failed to place bet');
      }
    } catch (error) {
      console.error('❌ Error placing color bet:', error);
      toast.error('Failed to place bet');
    }
  };
  
  const handleNumberBet = async (number: NumberType) => {
    console.log('🔢 Number bet clicked:', number);
    
    if (!isAuthenticated) {
      toast.error('Please log in to place bets');
      return;
    }
    if (!currentGame) {
      toast.error('No active game found');
      return;
    }
    if (!isAcceptingBets) {
      toast.error(`Betting closed! ${timeRemaining > 0 ? `Next game in ${timeRemaining}s` : 'Please wait for next game'}`);
      return;
    }
    if (userBalance < betAmount) {
      toast.error(`Insufficient balance! You have ₹${userBalance.toFixed(2)}, need ₹${betAmount}`);
      return;
    }
    
    console.log('✅ Placing number bet:', { number, amount: betAmount, game: currentGame.game_number });
    try {
      const success = await placeBet('number', number.toString());
      
      if (success) {
        toast.success(`Bet placed: ₹${betAmount} on number ${number}`, {
          description: `Game #${currentGame.game_number} • Time remaining: ${timeRemaining}s`
        });
      } else {
        toast.error('Failed to place bet');
      }
    } catch (error) {
      console.error('❌ Error placing number bet:', error);
      toast.error('Failed to place bet');
    }
  };

  const isSystemLoading = authLoading || gameLoading;
  const hasActiveGame = currentGame && currentGame.status === 'active';
  const hasTimeRemaining = timeRemaining > 0;
  const canAffordBet = userBalance >= betAmount;
  const canBet = isAuthenticated && !isSystemLoading && hasActiveGame && isAcceptingBets && canAffordBet;

  console.log('🎮 Betting panel state:', {
    isAuthenticated,
    isSystemLoading,
    currentGame: currentGame?.game_number || 'none',
    hasActiveGame,
    isAcceptingBets,
    hasTimeRemaining,
    timeRemaining,
    userBalance: userBalance.toFixed(2),
    betAmount,
    canAffordBet,
    canBet
  });

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6 space-y-6">
      {/* Enhanced Status Info */}
      <div className="text-center">
        <p className="text-sm text-gray-400">Your Balance</p>
        <p className="text-2xl font-bold text-white">₹{userBalance.toFixed(2)}</p>
        {currentGame && (
          <div className="mt-2 flex justify-center items-center gap-2">
            <span className="text-xs text-gray-400">Game #{currentGame.game_number}</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              isAcceptingBets 
                ? 'bg-green-500/20 text-green-300' 
                : 'bg-red-500/20 text-red-300'
            }`}>
              {isAcceptingBets ? `Betting Open (${timeRemaining}s)` : 'Betting Closed'}
            </span>
          </div>
        )}
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
