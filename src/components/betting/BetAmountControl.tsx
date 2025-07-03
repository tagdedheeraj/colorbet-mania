
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
  const predefinedAmounts = [10, 50, 100, 500, 1000];
  
  const handleBetAmountChange = (value: number[]) => {
    setBetAmount(value[0]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bet Amount</h3>
        <div className="glass-panel px-3 py-1 rounded-full">
          <span className="font-bold text-game-gold">{betAmount}</span>
          <span className="text-xs ml-1 opacity-70">coins</span>
        </div>
      </div>
      
      <Slider
        value={[betAmount]}
        min={10}
        max={isAuthenticated ? Math.min(userBalance, 1000) : 1000}
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
            onClick={() => setBetAmount(amount)}
            disabled={!canBet || userBalance < amount}
            className="glass-panel flex-1 border-none min-w-16"
          >
            {amount}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default BetAmountControl;
