
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
        return 'bg-game-red hover:bg-game-red/90';
      case 'green':
        return 'bg-game-green hover:bg-game-green/90';
      case 'purple-red':
        return 'bg-game-purple-red hover:bg-game-purple-red/90';
      default:
        return '';
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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Color Prediction</h3>
      <div className="grid grid-cols-3 gap-3">
        {(['red', 'green', 'purple-red'] as ColorType[]).map((color) => (
          <Button
            key={color}
            onClick={() => onColorBet(color)}
            disabled={!canBet || userBalance < betAmount}
            className={`color-button ${getColorStyle(color)} text-white h-14`}
          >
            <span className="capitalize">{color.replace('-', ' ')}</span>
            <span className="text-xs font-normal opacity-80 ml-1">
              ({getColorMultiplier(color)})
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ColorBetting;
