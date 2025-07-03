
import React from 'react';
import { Button } from "@/components/ui/button";
import { NumberType } from '@/types/supabaseGame';

interface NumberBettingProps {
  onNumberBet: (number: NumberType) => Promise<void>;
  canBet: boolean;
  userBalance: number;
  betAmount: number;
}

const NumberBetting: React.FC<NumberBettingProps> = ({
  onNumberBet,
  canBet,
  userBalance,
  betAmount
}) => {
  const numbers: NumberType[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Number Prediction</h3>
        <span className="badge bg-primary/20 text-primary-foreground text-xs px-2 py-1 rounded-full">9x</span>
      </div>
      
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {numbers.map((num) => (
          <Button
            key={num}
            onClick={() => onNumberBet(num)}
            disabled={!canBet || userBalance < betAmount}
            className={`number-button text-lg font-bold ${
              num === 0 
                ? 'bg-secondary text-muted-foreground hover:bg-secondary/80' 
                : 'bg-primary/20 text-primary-foreground hover:bg-primary/30'
            } min-w-12 aspect-square flex items-center justify-center`}
          >
            {num}
          </Button>
        ))}
      </div>
      <div className="bg-secondary/30 p-3 rounded-lg mt-2">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <span className="w-2 h-2 bg-destructive rounded-full"></span>
          Zero (0) always results in a loss
        </p>
      </div>
    </div>
  );
};

export default NumberBetting;
