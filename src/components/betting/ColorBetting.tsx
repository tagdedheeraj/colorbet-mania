
import React from 'react';
import { Button } from "@/components/ui/button";
import { ColorType } from '@/types/supabaseGame';

interface ColorBettingProps {
  onColorBet: (color: ColorType) => Promise<void>;
  canBet: boolean;
  userBalance: number;
  betAmount: number;
}

const ColorBetting: React.FC<ColorBettingProps> = ({
  onColorBet,
  canBet,
  userBalance,
  betAmount
}) => {
  const getColorStyle = (color: ColorType) => {
    switch (color) {
      case 'red':
        return 'bg-red-500 hover:bg-red-600 border-red-400';
      case 'green':
        return 'bg-green-500 hover:bg-green-600 border-green-400';
      case 'purple-red':
        return 'bg-purple-500 hover:bg-purple-600 border-purple-400';
      default:
        return 'bg-gray-500 hover:bg-gray-600 border-gray-400';
    }
  };
  
  const getColorMultiplier = (color: ColorType) => {
    switch (color) {
      case 'purple-red':
        return '0.90x';
      default:
        return '0.95x';
    }
  };

  const getColorName = (color: ColorType) => {
    switch (color) {
      case 'red':
        return 'Red';
      case 'green':
        return 'Green';
      case 'purple-red':
        return 'Purple';
      default:
        return color;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Color Prediction</h3>
      <div className="grid grid-cols-3 gap-3">
        {(['red', 'green', 'purple-red'] as ColorType[]).map((color) => (
          <Button
            key={color}
            onClick={() => onColorBet(color)}
            disabled={!canBet || userBalance < betAmount}
            className={`${getColorStyle(color)} text-white h-14 border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
          >
            <div className="flex flex-col items-center">
              <span className="font-bold">{getColorName(color)}</span>
              <span className="text-xs opacity-80">
                {getColorMultiplier(color)}
              </span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ColorBetting;
