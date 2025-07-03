
import React from 'react';
import useSupabaseGameStore from '@/store/supabaseGameStore';
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
    isLoading: gameLoading 
  } = useSupabaseGameStore();
  
  const { user, profile, isAuthenticated, isLoading: authLoading } = useSupabaseAuthStore();
  
  const handleColorBet = async (color: ColorType) => {
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
    if (!profile || (profile.balance || 0) < betAmount) {
      toast.error('Insufficient balance');
      return;
    }
    
    console.log('Placing color bet:', color, 'amount:', betAmount);
    await placeBet('color', color);
  };
  
  const handleNumberBet = async (number: NumberType) => {
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
    if (!profile || (profile.balance || 0) < betAmount) {
      toast.error('Insufficient balance');
      return;
    }
    
    console.log('Placing number bet:', number, 'amount:', betAmount);
    await placeBet('number', number.toString());
  };

  const userBalance = profile?.balance || 0;
  const isSystemLoading = authLoading || gameLoading;
  const canBet = isAuthenticated && !isSystemLoading && currentGame && isAcceptingBets;

  return (
    <div className="glass-panel p-4 mb-6 space-y-6">
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
