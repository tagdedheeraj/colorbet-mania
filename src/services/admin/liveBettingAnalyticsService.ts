
import { supabase } from '@/integrations/supabase/client';

export interface DetailedBet {
  bet_id: string;
  username: string;
  bet_type: string;
  bet_value: string;
  amount: number;
  potential_win: number;
  created_at: string;
}

export interface NumberBetBreakdown {
  number: string;
  count: number;
  amount: number;
  users: number;
  color: 'red' | 'green' | 'purple-red';
}

export interface LiveBettingAnalytics {
  gameId: string;
  gameNumber: number;
  uniquePlayers: number;
  totalBets: number;
  totalAmount: number;
  numberBreakdown: NumberBetBreakdown[];
  detailedBets: DetailedBet[];
}

export class LiveBettingAnalyticsService {
  static async getLiveBettingAnalytics(gameId: string): Promise<LiveBettingAnalytics> {
    try {
      console.log('📊 Loading live betting analytics for game:', gameId);

      // Get detailed bets for the game using a direct query since RPC might not be available yet
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select(`
          id,
          bet_type,
          bet_value,
          amount,
          potential_win,
          created_at,
          users!inner(username)
        `)
        .eq('game_id', gameId)
        .order('created_at', { ascending: false });

      if (betsError) {
        console.error('❌ Error loading detailed bets:', betsError);
        throw betsError;
      }

      // Get game info
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('game_number')
        .eq('id', gameId)
        .single();

      if (gameError) {
        console.error('❌ Error loading game data:', gameError);
        throw gameError;
      }

      // Process number breakdown
      const numberStats: { [key: string]: { count: number; amount: number; users: Set<string> } } = {};
      
      // Initialize all numbers 0-9
      for (let i = 0; i <= 9; i++) {
        numberStats[i.toString()] = { count: 0, amount: 0, users: new Set() };
      }

      // Process bets
      const uniqueUsers = new Set<string>();
      let totalBets = 0;
      let totalAmount = 0;

      const detailedBets: DetailedBet[] = [];

      betsData?.forEach((bet: any) => {
        // Add to detailed bets
        detailedBets.push({
          bet_id: bet.id,
          username: bet.users?.username || 'Unknown',
          bet_type: bet.bet_type,
          bet_value: bet.bet_value,
          amount: Number(bet.amount),
          potential_win: Number(bet.potential_win),
          created_at: bet.created_at
        });

        if (bet.bet_type === 'number') {
          const number = bet.bet_value;
          if (numberStats[number]) {
            numberStats[number].count++;
            numberStats[number].amount += Number(bet.amount);
            numberStats[number].users.add(bet.users?.username || 'Unknown');
          }
        }
        uniqueUsers.add(bet.users?.username || 'Unknown');
        totalBets++;
        totalAmount += Number(bet.amount);
      });

      // Convert to array format
      const numberBreakdown: NumberBetBreakdown[] = Object.entries(numberStats).map(([num, stats]) => ({
        number: num,
        count: stats.count,
        amount: stats.amount,
        users: stats.users.size,
        color: this.getColorForNumber(parseInt(num))
      }));

      console.log('✅ Live betting analytics processed:', {
        gameNumber: gameData.game_number,
        uniquePlayers: uniqueUsers.size,
        totalBets,
        totalAmount
      });

      return {
        gameId,
        gameNumber: gameData.game_number,
        uniquePlayers: uniqueUsers.size,
        totalBets,
        totalAmount,
        numberBreakdown,
        detailedBets
      };

    } catch (error) {
      console.error('❌ Error in getLiveBettingAnalytics:', error);
      throw error;
    }
  }

  static getColorForNumber(num: number): 'red' | 'green' | 'purple-red' {
    if ([1, 3, 7, 9].includes(num)) return 'red';
    if ([2, 4, 6, 8].includes(num)) return 'green';
    if ([0, 5].includes(num)) return 'purple-red';
    return 'red';
  }

  static async refreshAnalytics(): Promise<void> {
    try {
      console.log('🔄 Refreshing live betting analytics...');
      // For now, we'll just log this since the materialized view might not be available yet
      // Once the database functions are properly deployed, we can use the RPC call
      console.log('✅ Analytics refresh triggered');
    } catch (error) {
      console.error('❌ Error in refreshAnalytics:', error);
      throw error;
    }
  }
}
