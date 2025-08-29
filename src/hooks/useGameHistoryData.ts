
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
      
      // Group bets by period
      const periodGroups = results.reduce((acc, bet) => {
        const periodNumber = bet.period_number;
        if (!acc[periodNumber]) {
          acc[periodNumber] = {
            game: {
              period_number: periodNumber,
              result_color: 'green', // Default values for now
              result_number: 0,
              created_at: bet.created_at
            },
            bets: [],
            totalBetAmount: 0,
            totalWinAmount: 0,
            netResult: 0
          };
        }
        
        acc[periodNumber].bets.push(bet);
        acc[periodNumber].totalBetAmount += bet.amount;
        acc[periodNumber].totalWinAmount += bet.profit || 0;
        acc[periodNumber].netResult = acc[periodNumber].totalWinAmount - acc[periodNumber].totalBetAmount;
        
        return acc;
      }, {} as any);
      
      // Convert to array and sort by period number
      const sortedResults = Object.values(periodGroups).sort((a: any, b: any) => 
        b.game.period_number - a.game.period_number
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
      console.log('✅ Latest result loaded:', latest?.period_number);
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
