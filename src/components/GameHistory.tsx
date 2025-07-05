
import React, { useEffect, useState } from 'react';
import { useGameState } from '@/store/gameState';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { BetHistoryService } from '@/services/betHistoryService';
import { ColorType, BetWithGame } from '@/types/supabaseGame';

const GameHistory: React.FC = () => {
  const { user } = useSupabaseAuthStore();
  const [userGameResults, setUserGameResults] = useState<any[]>([]);
  const [latestResult, setLatestResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      loadUserGameResults();
      loadLatestResult();
    }
  }, [user]);

  const loadUserGameResults = async () => {
    if (!user) return;
    
    try {
      const results: BetWithGame[] = await BetHistoryService.loadAllUserBets(user.id);
      
      // Group bets by game
      const gameGroups = results.reduce((acc, bet) => {
        const gameId = bet.game_id;
        if (!acc[gameId]) {
          acc[gameId] = {
            game: bet.game,
            bets: [],
            totalBetAmount: 0,
            totalWinAmount: 0,
            netResult: 0
          };
        }
        
        acc[gameId].bets.push(bet);
        acc[gameId].totalBetAmount += bet.amount;
        acc[gameId].totalWinAmount += bet.actual_win || 0;
        acc[gameId].netResult = acc[gameId].totalWinAmount - acc[gameId].totalBetAmount;
        
        return acc;
      }, {} as any);
      
      // Convert to array and sort by game creation date
      const sortedResults = Object.values(gameGroups).sort((a: any, b: any) => 
        new Date(b.game.created_at).getTime() - new Date(a.game.created_at).getTime()
      );
      
      setUserGameResults(sortedResults);
    } catch (error) {
      console.error('Error loading user game results:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLatestResult = async () => {
    try {
      const latest = await BetHistoryService.getLatestCompletedGame();
      setLatestResult(latest);
    } catch (error) {
      console.error('Error loading latest result:', error);
    }
  };
  
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

  if (loading) {
    return (
      <div className="glass-panel p-4">
        <h3 className="text-lg font-semibold mb-2">Game History</h3>
        <p className="text-muted-foreground text-sm">Loading your game history...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="glass-panel p-4">
        <h3 className="text-lg font-semibold mb-2">Game History</h3>
        <p className="text-muted-foreground text-sm">Please login to view your game history.</p>
      </div>
    );
  }
  
  return (
    <div className="glass-panel p-4">
      <h3 className="text-lg font-semibold mb-3">Your Game History</h3>
      
      {/* Latest Result Display */}
      {latestResult && (
        <div className="glass-panel bg-primary/10 p-3 rounded-md mb-4">
          <h4 className="text-sm font-medium mb-2">Latest Result</h4>
          <div className="flex items-center justify-between">
            <span className="text-sm">Game #{latestResult.game_number}</span>
            <div className="flex items-center gap-2">
              <div className={`px-2 py-1 rounded text-xs font-medium ${getColorStyle(latestResult.result_color as ColorType)}`}>
                {latestResult.result_color === 'purple-red' ? 'Purple Red' : latestResult.result_color}
              </div>
              <div className={`w-6 h-6 rounded-full ${getColorStyle(latestResult.result_color as ColorType)} flex items-center justify-center`}>
                <span className="text-xs font-bold">{latestResult.result_number}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {userGameResults.length === 0 ? (
        <p className="text-muted-foreground text-sm">No bets placed yet.</p>
      ) : (
        <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
          {userGameResults.map((gameResult: any) => (
            <div key={gameResult.game.id} className="glass-panel bg-secondary/30 p-3 rounded-md space-y-3">
              {/* Game result info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Game #{gameResult.game.game_number}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(gameResult.game.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium truncate max-w-[80px] ${getColorStyle(gameResult.game.result_color as ColorType)}`}>
                    {gameResult.game.result_color === 'purple-red' ? 'Purple Red' : gameResult.game.result_color}
                  </div>
                  <div className={`w-6 h-6 rounded-full ${getColorStyle(gameResult.game.result_color as ColorType)} flex items-center justify-center`}>
                    <span className="text-xs font-bold">{gameResult.game.result_number}</span>
                  </div>
                </div>
              </div>
              
              {/* User profit/loss summary */}
              <div className="border-t border-border/30 pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Your Result:</span>
                  <span className={`text-sm font-bold ${
                    gameResult.netResult > 0 ? 'text-game-green' : 
                    gameResult.netResult < 0 ? 'text-game-red' : 'text-muted-foreground'
                  }`}>
                    {gameResult.netResult > 0 ? `+${gameResult.netResult.toFixed(2)}` : 
                     gameResult.netResult < 0 ? `${gameResult.netResult.toFixed(2)}` : '0.00'} coins
                  </span>
                </div>
                
                {/* Individual bets */}
                <div className="space-y-1">
                  {gameResult.bets.map((bet: any) => (
                    <div key={bet.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-primary-foreground/70">
                          {bet.bet_type === 'color' ? 
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameHistory;
