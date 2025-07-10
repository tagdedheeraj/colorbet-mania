
import { useState, useCallback } from 'react';
import { BetHistoryService } from '@/services/betHistoryService';
import { BetWithGame } from '@/types/supabaseGame';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';

export const useGameHistoryData = () => {
  const { user } = useSupabaseAuthStore();
  const [userGameResults, setUserGameResults] = useState<any[]>([]);
  const [latestResult, setLatestResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNewResults, setHasNewResults] = useState(false);

  const loadUserGameResults = useCallback(async (showRefreshing = false) => {
    if (!user) return;
    
    try {
      if (showRefreshing) {
        setRefreshing(true);
        setHasNewResults(false);
      }
      
      console.log('📊 Loading user game results...');
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
      
      // Check if we have new results
      if (userGameResults.length > 0 && sortedResults.length > userGameResults.length) {
        setHasNewResults(true);
      }
      
      setUserGameResults(sortedResults);
      console.log('✅ User game results loaded:', sortedResults.length);
    } catch (error) {
      console.error('❌ Error loading user game results:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, userGameResults.length]);

  const loadLatestResult = useCallback(async () => {
    try {
      console.log('🎯 Loading latest game result...');
      const latest = await BetHistoryService.getLatestCompletedGame();
      setLatestResult(latest);
      console.log('✅ Latest result loaded:', latest?.game_number);
    } catch (error) {
      console.error('❌ Error loading latest result:', error);
    }
  }, []);

  const refreshData = useCallback(async () => {
    console.log('🔄 Refreshing game history data...');
    await Promise.all([
      loadUserGameResults(true),
      loadLatestResult()
    ]);
  }, [loadUserGameResults, loadLatestResult]);

  const clearNewResultsFlag = useCallback(() => {
    setHasNewResults(false);
  }, []);

  return {
    userGameResults,
    latestResult,
    loading,
    refreshing,
    hasNewResults,
    loadUserGameResults,
    loadLatestResult,
    refreshData,
    clearNewResultsFlag
  };
};
