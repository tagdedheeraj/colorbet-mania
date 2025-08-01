
import React, { useEffect, useState } from 'react';
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
  
  // Local state to track betting activity
  const [recentlyPlacedBet, setRecentlyPlacedBet] = useState(false);
  
  // Load user balance when component mounts or user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserBalance();
    }
  }, [isAuthenticated, user, loadUserBalance]);
  
  // Reset recently placed bet flag when betting window opens again
  useEffect(() => {
    if (isAcceptingBets && recentlyPlacedBet) {
      setRecentlyPlacedBet(false);
    }
  }, [isAcceptingBets, recentlyPlacedBet]);
  
  const handleColorBet = async (color: ColorType) => {
    console.log('🎨 Color bet clicked:', color);
    
    if (!isAuthenticated) {
      toast.error('कृपया bet लगाने के लिए login करें');
      return;
    }
    if (!currentGame) {
      toast.error('कोई active game नहीं मिला');
      return;
    }
    if (!isAcceptingBets) {
      toast.error(`Betting बंद! ${timeRemaining > 0 ? `Result ${timeRemaining}s में` : 'कृपया अगले game का इंतज़ार करें'}`);
      return;
    }
    if (userBalance < betAmount) {
      toast.error(`Balance कम है! आपके पास ₹${userBalance.toFixed(2)} है, जरूरत ₹${betAmount} की`);
      return;
    }
    
    console.log('✅ Placing color bet:', { color, amount: betAmount, game: currentGame.game_number });
    
    try {
      const success = await placeBet('color', color);
      
      if (success) {
        setRecentlyPlacedBet(true);
        toast.success(`Bet लगाई गई: ₹${betAmount} ${color} पर`, {
          description: `Game #${currentGame.game_number} • समय बचा: ${timeRemaining}s`
        });
        
        // Reload balance immediately after successful bet
        setTimeout(() => {
          loadUserBalance();
        }, 500);
      } else {
        toast.error('Bet लगाने में असफल');
      }
    } catch (error) {
      console.error('❌ Error placing color bet:', error);
      toast.error('Bet लगाने में असफल');
    }
  };
  
  const handleNumberBet = async (number: NumberType) => {
    console.log('🔢 Number bet clicked:', number);
    
    if (!isAuthenticated) {
      toast.error('कृपया bet लगाने के लिए login करें');
      return;
    }
    if (!currentGame) {
      toast.error('कोई active game नहीं मिला');
      return;
    }
    if (!isAcceptingBets) {
      toast.error(`Betting बंद! ${timeRemaining > 0 ? `Result ${timeRemaining}s में` : 'कृपया अगले game का इंतज़ार करें'}`);
      return;
    }
    if (userBalance < betAmount) {
      toast.error(`Balance कम है! आपके पास ₹${userBalance.toFixed(2)} है, जरूरत ₹${betAmount} की`);
      return;
    }
    
    console.log('✅ Placing number bet:', { number, amount: betAmount, game: currentGame.game_number });
    
    try {
      const success = await placeBet('number', number.toString());
      
      if (success) {
        setRecentlyPlacedBet(true);
        toast.success(`Bet लगाई गई: ₹${betAmount} number ${number} पर`, {
          description: `Game #${currentGame.game_number} • समय बचा: ${timeRemaining}s`
        });
        
        // Reload balance immediately after successful bet
        setTimeout(() => {
          loadUserBalance();
        }, 500);
      } else {
        toast.error('Bet लगाने में असफल');
      }
    } catch (error) {
      console.error('❌ Error placing number bet:', error);
      toast.error('Bet लगाने में असफल');
    }
  };

  const isSystemLoading = authLoading || gameLoading;
  const hasActiveGame = currentGame && currentGame.status === 'active';
  const hasTimeRemaining = timeRemaining > 0;
  const canAffordBet = userBalance >= betAmount;
  const canBet = Boolean(isAuthenticated && !isSystemLoading && hasActiveGame && isAcceptingBets && canAffordBet);

  // Enhanced betting status display
  const getBettingStatusInfo = () => {
    if (!isAuthenticated) return { status: 'Login Required', color: 'text-red-400' };
    if (isSystemLoading) return { status: 'Loading...', color: 'text-yellow-400' };
    if (!hasActiveGame) return { status: 'No Active Game', color: 'text-gray-400' };
    if (!hasTimeRemaining) return { status: 'Awaiting New Game', color: 'text-blue-400' };
    if (!canAffordBet) return { status: 'Insufficient Balance', color: 'text-red-400' };
    if (!isAcceptingBets) return { status: `Result in ${timeRemaining}s`, color: 'text-orange-400' };
    return { status: `Betting Open (${timeRemaining}s)`, color: 'text-green-400' };
  };

  const statusInfo = getBettingStatusInfo();

  console.log('🎮 Betting panel state:', {
    isAuthenticated,
    isSystemLoading,
    currentGame: currentGame?.game_number || 'none',
    hasActiveGame: Boolean(hasActiveGame),
    isAcceptingBets,
    hasTimeRemaining,
    timeRemaining,
    userBalance: userBalance.toFixed(2),
    betAmount,
    canAffordBet,
    canBet,
    recentlyPlacedBet,
    statusInfo: statusInfo.status
  });

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6 space-y-6">
      {/* Enhanced Status Info with persistent countdown */}
      <div className="text-center">
        <p className="text-sm text-gray-400">आपका Balance</p>
        <p className="text-2xl font-bold text-white">₹{userBalance.toFixed(2)}</p>
        {currentGame && (
          <div className="mt-2 space-y-2">
            <div className="flex justify-center items-center gap-2">
              <span className="text-xs text-gray-400">Game #{currentGame.game_number}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isAcceptingBets 
                  ? 'bg-green-500/20 text-green-300 animate-pulse' 
                  : 'bg-red-500/20 text-red-300'
              }`}>
                {statusInfo.status}
              </span>
            </div>
            
            {/* Always show countdown when game is active */}
            {hasTimeRemaining && (
              <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isAcceptingBets ? 'bg-green-500 animate-pulse' : 'bg-orange-500'
                }`}></div>
                <span className="text-lg font-mono font-bold text-white">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
                <div className={`w-2 h-2 rounded-full ${
                  isAcceptingBets ? 'bg-green-500 animate-pulse' : 'bg-orange-500'
                }`}></div>
              </div>
            )}
            
            {/* Show recent bet confirmation */}
            {recentlyPlacedBet && isAcceptingBets && (
              <div className="bg-green-500/20 text-green-300 text-xs px-3 py-1 rounded-full inline-block">
                ✓ Bet Placed! आप और भी bet लगा सकते हैं
              </div>
            )}
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

      {/* Enhanced debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-black/20 p-2 rounded text-xs text-gray-400 space-y-1">
          <div>Timer: {timeRemaining}s | Betting: {isAcceptingBets ? 'Open' : 'Closed'}</div>
          <div>Balance: ₹{userBalance} | Bet: ₹{betAmount} | Can Bet: {canBet.toString()}</div>
          <div>Recent Bet: {recentlyPlacedBet.toString()} | Game: #{currentGame?.game_number || 'None'}</div>
        </div>
      )}
    </div>
  );
};

export default BettingPanel;
