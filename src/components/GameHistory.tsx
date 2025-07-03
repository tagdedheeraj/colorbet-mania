
import React from 'react';
import useGameStore from '@/store/gameStore';
import { ColorType } from '@/types/game';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';

const GameHistory: React.FC = () => {
  const { lastResults } = useGameStore();
  const { user, profile } = useSupabaseAuthStore();
  
  const getColorStyle = (color: ColorType) => {
    switch (color) {
      case 'red':
        return 'bg-game-red text-white';
      case 'green':
        return 'bg-game-green text-white';
      case 'purple-red':
        return 'bg-game-purple-red text-white';
      default:
        return '';
    }
  };
  
  if (lastResults.length === 0) {
    return (
      <div className="glass-panel p-4">
        <h3 className="text-lg font-semibold mb-2">Game History</h3>
        <p className="text-muted-foreground text-sm">No games played yet.</p>
      </div>
    );
  }
  
  return (
    <div className="glass-panel p-4">
      <h3 className="text-lg font-semibold mb-3">Game History</h3>
      <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
        {lastResults.map((result) => {
          // For now, we'll handle user bets from the game store since profile doesn't have bets
          const userBetsForGame = user ? [] : [];
          
          return (
            <div key={result.id} className="glass-panel bg-secondary/30 p-3 rounded-md space-y-3">
              {/* Game result info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Game #{result.gameId}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium truncate max-w-[80px] ${getColorStyle(result.resultColor)}`}>
                    {result.resultColor === 'purple-red' ? 'Purple Red' : result.resultColor}
                  </div>
                  <div className={`w-6 h-6 rounded-full ${getColorStyle(result.resultColor)} flex items-center justify-center`}>
                    <span className="text-xs font-bold">{result.resultNumber}</span>
                  </div>
                </div>
              </div>
              
              {/* User bets for this game */}
              {user && userBetsForGame && userBetsForGame.length > 0 ? (
                <div className="border-t border-border/30 pt-2 space-y-1">
                  <span className="text-xs text-muted-foreground">Your bets:</span>
                  {userBetsForGame.map((bet) => (
                    <div key={bet.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-primary-foreground/70">Bet on:</span>
                        <span className="font-medium capitalize">{bet.type === 'color' ? 
                          (bet.value === 'purple-red' ? 'Purple Red' : bet.value) : 
                          `Number ${bet.value}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{bet.amount} coins</span>
                        <span className={bet.won ? "text-game-green" : "text-game-red"}>
                          {bet.won ? `+${bet.potentialWin.toFixed(1)}` : '-'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GameHistory;
