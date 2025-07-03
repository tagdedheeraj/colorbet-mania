
import React from 'react';
import useSupabaseGameStore from '@/store/supabaseGameStore';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { ColorType } from '@/types/supabaseGame';

const GameHistory: React.FC = () => {
  const { gameHistory, currentBets } = useSupabaseGameStore();
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
  
  if (gameHistory.length === 0) {
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
        {gameHistory.map((result) => {
          // Find user bets for this game
          const userBetsForGame = currentBets.filter(bet => bet.game_id === result.id);
          
          // Calculate total win/loss for this game
          const totalBetAmount = userBetsForGame.reduce((sum, bet) => sum + bet.amount, 0);
          const totalWinAmount = userBetsForGame.reduce((sum, bet) => sum + (bet.actual_win || 0), 0);
          const netResult = totalWinAmount - totalBetAmount;
          
          return (
            <div key={result.id} className="glass-panel bg-secondary/30 p-3 rounded-md space-y-3">
              {/* Game result info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Game #{result.game_number}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(result.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium truncate max-w-[80px] ${getColorStyle(result.result_color as ColorType)}`}>
                    {result.result_color === 'purple-red' ? 'Purple Red' : result.result_color}
                  </div>
                  <div className={`w-6 h-6 rounded-full ${getColorStyle(result.result_color as ColorType)} flex items-center justify-center`}>
                    <span className="text-xs font-bold">{result.result_number}</span>
                  </div>
                </div>
              </div>
              
              {/* User bets for this game */}
              {user && userBetsForGame && userBetsForGame.length > 0 ? (
                <div className="border-t border-border/30 pt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Your bets:</span>
                    <span className={`text-xs font-bold ${
                      netResult > 0 ? 'text-game-green' : netResult < 0 ? 'text-game-red' : 'text-muted-foreground'
                    }`}>
                      {netResult > 0 ? `+${netResult.toFixed(2)}` : netResult < 0 ? `${netResult.toFixed(2)}` : '0.00'}
                    </span>
                  </div>
                  {userBetsForGame.map((bet) => (
                    <div key={bet.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-primary-foreground/70">Bet on:</span>
                        <span className="font-medium capitalize">{bet.bet_type === 'color' ? 
                          (bet.bet_value === 'purple-red' ? 'Purple Red' : bet.bet_value) : 
                          `Number ${bet.bet_value}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{bet.amount} coins</span>
                        <span className={bet.is_winner ? "text-game-green" : "text-game-red"}>
                          {bet.is_winner ? `+${bet.actual_win || bet.potential_win}` : '-'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : user ? (
                <div className="border-t border-border/30 pt-2">
                  <span className="text-xs text-muted-foreground">No bets placed</span>
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
