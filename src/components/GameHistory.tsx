
import React from 'react';
import useGameStore from '@/store/gameStore';
import { ColorType } from '@/types/game';
import useAuthStore from '@/store/authStore';

const GameHistory: React.FC = () => {
  const { lastResults } = useGameStore();
  const { user } = useAuthStore();
  
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
          // Find user bets for this game if user is logged in
          const userBetsForGame = user ? 
            user.bets?.filter(bet => bet.gameId === result.gameId) : 
            [];
          
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
