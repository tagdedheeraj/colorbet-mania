
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
        <h3 className="text-lg font-semibold text-white">Number Prediction</h3>
        <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full">9x</span>
      </div>
      
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {numbers.map((num) => (
          <Button
            key={num}
            onClick={() => onNumberBet(num)}
            disabled={!canBet || userBalance < betAmount}
            className={`${
              num === 0 
                ? 'bg-gray-600 hover:bg-gray-700 text-gray-300 border-gray-500' 
                : 'bg-blue-500 hover:bg-blue-600 text-white border-blue-400'
            } min-w-12 aspect-square flex items-center justify-center text-lg font-bold border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
          >
            {num}
          </Button>
        ))}
      </div>
      <div className="bg-red-500/20 border border-red-500/30 p-3 rounded-lg mt-2">
        <p className="text-sm text-red-300 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          Zero (0) always results in a loss
        </p>
      </div>
    </div>
  );
};

export default NumberBetting;
