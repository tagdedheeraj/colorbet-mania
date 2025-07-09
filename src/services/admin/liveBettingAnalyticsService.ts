
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

      // Get detailed bets for the game
      const { data: detailedBets, error: betsError } = await supabase
        .rpc('get_live_game_detailed_bets', { p_game_id: gameId });

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

      detailedBets?.forEach(bet => {
        if (bet.bet_type === 'number') {
          const number = bet.bet_value;
          if (numberStats[number]) {
            numberStats[number].count++;
            numberStats[number].amount += Number(bet.amount);
            numberStats[number].users.add(bet.username);
          }
        }
        uniqueUsers.add(bet.username);
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
        detailedBets: detailedBets || []
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
      const { error } = await supabase.rpc('refresh_live_betting_analytics');
      if (error) {
        console.error('❌ Error refreshing analytics:', error);
        throw error;
      }
      console.log('✅ Analytics refreshed successfully');
    } catch (error) {
      console.error('❌ Error in refreshAnalytics:', error);
      throw error;
    }
  }
}
