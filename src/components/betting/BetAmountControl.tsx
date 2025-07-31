
import React from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface BetAmountControlProps {
  betAmount: number;
  setBetAmount: (amount: number) => void;
  userBalance: number;
  isAuthenticated: boolean;
  canBet: boolean;
}

const BetAmountControl: React.FC<BetAmountControlProps> = ({
  betAmount,
  setBetAmount,
  userBalance,
  isAuthenticated,
  canBet
}) => {
  const maxBetAmount = isAuthenticated ? Math.min(userBalance, 1000) : 1000;
  const minBetAmount = 10;
  
  // Smart predefined amounts based on user balance
  const getPredefinedAmounts = () => {
    const baseAmounts = [10, 50, 100, 500, 1000];
    return baseAmounts.filter(amount => amount <= userBalance).slice(0, 5);
  };
  
  const predefinedAmounts = getPredefinedAmounts();
  
  const handleBetAmountChange = (value: number[]) => {
    const newAmount = Math.max(minBetAmount, Math.min(value[0], maxBetAmount));
    setBetAmount(newAmount);
  };

  const handlePredefinedAmount = (amount: number) => {
    const validAmount = Math.max(minBetAmount, Math.min(amount, maxBetAmount));
    setBetAmount(validAmount);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bet Amount</h3>
        <div className="glass-panel px-3 py-1 rounded-full">
          <span className="font-bold text-game-gold">₹{betAmount}</span>
          {userBalance < betAmount && (
            <span className="text-xs ml-2 text-red-400">(Insufficient)</span>
          )}
        </div>
      </div>

      {isAuthenticated && (
        <div className="text-xs text-gray-400 text-center">
          Balance: ₹{userBalance.toFixed(2)} • Max Bet: ₹{maxBetAmount}
        </div>
      )}
      
      <Slider
        value={[betAmount]}
        min={minBetAmount}
        max={maxBetAmount}
        step={10}
        onValueChange={handleBetAmountChange}
        className="my-4"
        disabled={!canBet}
      />
      
      <div className="flex flex-wrap gap-2 justify-between">
        {predefinedAmounts.map((amount) => (
          <Button
            key={amount}
            variant="outline"
            size="sm"
            onClick={() => handlePredefinedAmount(amount)}
            disabled={!canBet || userBalance < amount}
            className={`glass-panel flex-1 border-none min-w-16 ${
              betAmount === amount ? 'bg-primary/20 border-primary/50' : ''
            }`}
          >
            ₹{amount}
          </Button>
        ))}
      </div>

      {isAuthenticated && userBalance < 50 && (
        <div className="bg-yellow-500/20 border border-yellow-500/30 p-2 rounded-lg">
          <p className="text-xs text-yellow-300 text-center">
            💡 Low balance! Consider adding funds to place higher bets.
          </p>
        </div>
      )}
    </div>
  );
};

export default BetAmountControl;
