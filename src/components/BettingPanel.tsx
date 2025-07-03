
import React from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import useSupabaseGameStore from '@/store/supabaseGameStore';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { ColorType, NumberType } from '@/types/supabaseGame';
import { toast } from "sonner";

const BettingPanel: React.FC = () => {
  const { betAmount, setBetAmount, placeBet, isAcceptingBets, timeRemaining } = useSupabaseGameStore();
  const { user, profile, isAuthenticated } = useSupabaseAuthStore();
  
  const predefinedAmounts = [10, 50, 100, 500, 1000];
  
  const handleColorBet = (color: ColorType) => {
    if (!isAuthenticated) {
      toast.error('Please log in to place bets');
      return;
    }
    if (!isAcceptingBets) {
      toast.error(`Betting closed! Next game in ${timeRemaining}s`);
      return;
    }
    placeBet('color', color);
  };
  
  const handleNumberBet = (number: NumberType) => {
    if (!isAuthenticated) {
      toast.error('Please log in to place bets');
      return;
    }
    if (!isAcceptingBets) {
      toast.error(`Betting closed! Next game in ${timeRemaining}s`);
      return;
    }
    placeBet('number', number.toString());
  };
  
  const handleBetAmountChange = (value: number[]) => {
    setBetAmount(value[0]);
  };

  const numbers: NumberType[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  
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

  const userBalance = profile?.balance || 0;

  return (
    <div className="glass-panel p-4 mb-6 space-y-6">
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
          max={isAuthenticated && profile ? Math.min(userBalance, 1000) : 1000}
          step={10}
          onValueChange={handleBetAmountChange}
          className="my-4"
          disabled={!isAcceptingBets || !isAuthenticated}
        />
        
        <div className="flex flex-wrap gap-2 justify-between">
          {predefinedAmounts.map((amount) => (
            <Button
              key={amount}
              variant="outline"
              size="sm"
              onClick={() => setBetAmount(amount)}
              disabled={!isAcceptingBets || !isAuthenticated || (profile ? userBalance < amount : false)}
              className="glass-panel flex-1 border-none min-w-16"
            >
              {amount}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Color Prediction</h3>
        <div className="grid grid-cols-3 gap-3">
          {(['red', 'green', 'purple-red'] as ColorType[]).map((color) => (
            <Button
              key={color}
              onClick={() => handleColorBet(color)}
              disabled={!isAcceptingBets || !isAuthenticated || (profile && userBalance < betAmount)}
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
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Number Prediction</h3>
          <span className="badge bg-primary/20 text-primary-foreground text-xs px-2 py-1 rounded-full">9x</span>
        </div>
        
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {numbers.map((num) => (
            <Button
              key={num}
              onClick={() => handleNumberBet(num)}
              disabled={!isAcceptingBets || !isAuthenticated || (profile && userBalance < betAmount)}
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
      
      {!isAuthenticated && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
          <p className="text-yellow-500 text-sm text-center">
            Please log in to place bets
          </p>
        </div>
      )}
    </div>
  );
};

export default BettingPanel;
