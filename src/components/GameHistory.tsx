
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bell } from 'lucide-react';
import { ColorType } from '@/types/supabaseGame';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { useGameHistoryData } from '@/hooks/useGameHistoryData';
import { useGameHistoryRealtime } from '@/hooks/useGameHistoryRealtime';
import { toast } from 'sonner';

const GameHistory: React.FC = () => {
  const { user } = useSupabaseAuthStore();
  const {
    userGameResults,
    latestResult,
    loading,
    refreshing,
    hasNewResults,
    loadUserGameResults,
    loadLatestResult,
    refreshData,
    clearNewResultsFlag
  } = useGameHistoryData();

  // Set up real-time subscriptions
  useGameHistoryRealtime(
    () => {
      console.log('🎮 Game completed - refreshing history...');
      refreshData();
      toast.success('New game result available!');
    },
    () => {
      console.log('💰 Bet updated - refreshing history...');
      refreshData();
    }
  );

  useEffect(() => {
    if (user) {
      loadUserGameResults();
      loadLatestResult();
    }
  }, [user, loadUserGameResults, loadLatestResult]);
  
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

  const handleManualRefresh = () => {
    refreshData();
    clearNewResultsFlag();
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
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Your Game History</h3>
        <div className="flex items-center gap-2">
          {hasNewResults && (
            <div className="flex items-center gap-1 text-game-green text-xs animate-pulse">
              <Bell size={12} />
              <span>New!</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>
      
      {/* Latest Result Display */}
      {latestResult && (
        <div className="glass-panel bg-primary/10 p-3 rounded-md mb-4">
          <h4 className="text-sm font-medium mb-2">Latest Result</h4>
          <div className="flex items-center justify-between">
            <span className="text-sm">Period #{latestResult.period_number}</span>
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
          {refreshing && (
            <div className="text-center py-2">
              <span className="text-xs text-muted-foreground">Updating results...</span>
            </div>
          )}
          {userGameResults.map((gameResult: any, index: number) => (
            <div 
              key={gameResult.game.period_number} 
              className={`glass-panel bg-secondary/30 p-3 rounded-md space-y-3 transition-all duration-300 ${
                index === 0 && hasNewResults ? 'ring-2 ring-game-green/50 animate-pulse' : ''
              }`}
            >
              {/* Game result info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Period #{gameResult.game.period_number}</span>
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
                        <span className={bet.status === 'won' ? "text-game-green" : "text-game-red"}>
                          {bet.status === 'won' ? `+${bet.profit}` : '-'}
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
