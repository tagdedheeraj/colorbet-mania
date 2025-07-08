
import React, { useEffect, useState, useCallback } from 'react';
import { useGameState } from '@/store/gameState';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { BetHistoryService } from '@/services/betHistoryService';
import { ColorType, BetWithGame } from '@/types/supabaseGame';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GameHistory: React.FC = () => {
  const { user } = useSupabaseAuthStore();
  const { currentBets, userBalance } = useGameState();
  const [userGameResults, setUserGameResults] = useState<any[]>([]);
  const [latestResult, setLatestResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const loadUserGameResults = useCallback(async () => {
    if (!user) {
      setUserGameResults([]);
      setLoading(false);
      return;
    }
    
    try {
      console.log('Loading game results for user:', user.id);
      const results: BetWithGame[] = await BetHistoryService.loadAllUserBets(user.id);
      
      if (results.length === 0) {
        console.log('No bet results found');
        setUserGameResults([]);
        setError(null);
        return;
      }

      // Group bets by game
      const gameGroups = results.reduce((acc, bet) => {
        const gameId = bet.game_id;
        if (!gameId) return acc;
        
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
        acc[gameId].totalBetAmount += bet.amount || 0;
        acc[gameId].totalWinAmount += bet.actual_win || 0;
        acc[gameId].netResult = acc[gameId].totalWinAmount - acc[gameId].totalBetAmount;
        
        return acc;
      }, {} as any);
      
      // Convert to array and sort by game creation date
      const sortedResults = Object.values(gameGroups).sort((a: any, b: any) => 
        new Date(b.game.created_at).getTime() - new Date(a.game.created_at).getTime()
      );
      
      console.log('Processed game results:', sortedResults.length);
      setUserGameResults(sortedResults);
      setError(null);
    } catch (error) {
      console.error('Error loading user game results:', error);
      setError('Failed to load bet history');
    }
  }, [user]);

  const loadLatestResult = useCallback(async () => {
    try {
      const latest = await BetHistoryService.getLatestCompletedGame();
      setLatestResult(latest);
    } catch (error) {
      console.error('Error loading latest result:', error);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUserGameResults(), loadLatestResult()]);
    setRefreshing(false);
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadUserGameResults(), loadLatestResult()]);
      setLoading(false);
    };
    
    loadData();
  }, [user, loadUserGameResults, loadLatestResult]);

  // Auto-refresh when currentBets or userBalance changes (indicating new bet activity)
  useEffect(() => {
    if (user && currentBets.length >= 0) {
      console.log('Current bets changed, refreshing history');
      loadUserGameResults();
    }
  }, [currentBets, userBalance, user, loadUserGameResults]);

  // Set up real-time subscriptions for bets table
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for user bets');
    
    const channel = supabase
      .channel('user_bets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bets',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time bet update:', payload);
          // Refresh the history when user's bets change
          loadUserGameResults();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user, loadUserGameResults]);

  const getColorStyle = (color: ColorType) => {
    switch (color) {
      case 'red':
        return 'bg-game-red text-white';
      case 'green':
        return 'bg-game-green text-white';
      case 'purple-red':
        return 'bg-game-purple-red text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Your Game History</h3>
          <RefreshCw className="h-4 w-4 animate-spin" />
        </div>
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

  if (error) {
    return (
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Your Game History</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Your Game History</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh history"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
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
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm mb-2">No bets placed yet.</p>
          <p className="text-xs text-muted-foreground">Your betting history will appear here after you place your first bet.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
          {userGameResults.map((gameResult: any, index: number) => (
            <div key={gameResult.game.id || index} className="glass-panel bg-secondary/30 p-3 rounded-md space-y-3">
              {/* Game result info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Game #{gameResult.game.game_number || 'Unknown'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {gameResult.game.created_at ? 
                      new Date(gameResult.game.created_at).toLocaleTimeString() : 
                      'Unknown time'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium truncate max-w-[80px] ${getColorStyle(gameResult.game.result_color as ColorType)}`}>
                    {gameResult.game.result_color === 'purple-red' ? 'Purple Red' : 
                     gameResult.game.result_color || 'Unknown'}
                  </div>
                  <div className={`w-6 h-6 rounded-full ${getColorStyle(gameResult.game.result_color as ColorType)} flex items-center justify-center`}>
                    <span className="text-xs font-bold">
                      {gameResult.game.result_number || '?'}
                    </span>
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
                  {gameResult.bets.map((bet: any, betIndex: number) => (
                    <div key={bet.id || betIndex} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-primary-foreground/70">
                          {bet.bet_type === 'color' ? 
                            (bet.bet_value === 'purple-red' ? 'Purple Red' : bet.bet_value) : 
                            `Number ${bet.bet_value}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{bet.amount || 0} coins</span>
                        <span className={bet.is_winner ? "text-game-green" : "text-game-red"}>
                          {bet.is_winner ? `+${bet.actual_win || bet.potential_win || 0}` : '-'}
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
