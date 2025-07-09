
import { supabase } from '@/integrations/supabase/client';
import { GameModeService } from './admin/gameModeService';
import { AdminLoggingService } from './admin/adminLoggingService';
import AdminAuthService from './adminAuthService';

export interface LiveGameStats {
  activeGame: any;
  activePlayers: number;
  totalBets: number;
  totalBetAmount: number;
  numberBets: Record<string, { count: number; amount: number }>;
}

export class AdminGameService {
  // Enhanced method using the new GameModeService
  static async setGameMode(gameId: string, mode: 'automatic' | 'manual'): Promise<boolean> {
    try {
      console.log('🔄 AdminGameService: Setting game mode via enhanced service:', { gameId, mode });
      
      const success = await GameModeService.setGameMode(gameId, mode);
      
      if (success) {
        await AdminLoggingService.logAdminAction('set_game_mode', {
          game_id: gameId,
          mode: mode,
          method: 'enhanced_service'
        });
      }
      
      return success;
    } catch (error) {
      console.error('❌ AdminGameService: Error in setGameMode:', error);
      return false;
    }
  }

  static async setManualResult(gameId: string, number: number): Promise<boolean> {
    try {
      console.log('🎯 AdminGameService: Setting manual result:', { gameId, number });
      
      // Get current admin user
      const adminUser = await AdminAuthService.getCurrentAdminUser();
      if (!adminUser) {
        console.error('❌ No authenticated admin user found');
        return false;
      }

      // Use enhanced database function
      const { data, error } = await supabase.rpc('set_manual_game_result_enhanced', {
        p_game_id: gameId,
        p_admin_user_id: adminUser.id,
        p_result_number: number
      });

      if (error) {
        console.error('❌ Error setting manual result:', error);
        return false;
      }

      let response;
      try {
        if (typeof data === 'string') {
          response = JSON.parse(data);
        } else {
          response = data;
        }
      } catch (parseError) {
        console.error('❌ Error parsing response:', parseError);
        return false;
      }

      if (response && !response.success) {
        console.error('❌ Manual result setting failed:', response.message);
        return false;
      }

      await AdminLoggingService.logAdminAction('set_manual_result', {
        game_id: gameId,
        result_number: number
      });

      console.log('✅ Manual result set successfully');
      return true;

    } catch (error) {
      console.error('❌ Exception in setManualResult:', error);
      return false;
    }
  }

  static async completeGameManually(gameId: string): Promise<boolean> {
    try {
      console.log('🏁 AdminGameService: Completing game manually:', gameId);
      
      // Get current admin user
      const adminUser = await AdminAuthService.getCurrentAdminUser();
      if (!adminUser) {
        console.error('❌ No authenticated admin user found');
        return false;
      }

      // Use database function
      const { data, error } = await supabase.rpc('complete_manual_game', {
        p_game_id: gameId,
        p_admin_user_id: adminUser.id
      });

      if (error) {
        console.error('❌ Error completing game manually:', error);
        return false;
      }

      let response;
      try {
        if (typeof data === 'string') {
          response = JSON.parse(data);
        } else {
          response = data;
        }
      } catch (parseError) {
        console.error('❌ Error parsing completion response:', parseError);
        return false;
      }

      if (response && !response.success) {
        console.error('❌ Manual game completion failed:', response.message);
        return false;
      }

      await AdminLoggingService.logAdminAction('complete_game_manually', {
        game_id: gameId
      });

      console.log('✅ Game completed manually');
      return true;

    } catch (error) {
      console.error('❌ Exception in completeGameManually:', error);
      return false;
    }
  }

  static async getCurrentGameStats(): Promise<LiveGameStats> {
    try {
      console.log('📊 AdminGameService: Loading current game stats...');

      // Get active game
      const { data: activeGame, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (gameError) {
        console.log('No active game found:', gameError);
        throw new Error('No active game found');
      }

      // Get bets for active game
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('game_id', activeGame.id);

      if (betsError) {
        console.error('Error loading bets:', betsError);
        throw betsError;
      }

      // Calculate stats
      const activePlayers = new Set(bets?.map(bet => bet.user_id) || []).size;
      const totalBets = bets?.length || 0;
      const totalBetAmount = bets?.reduce((sum, bet) => sum + (bet.amount || 0), 0) || 0;

      // Group bets by number
      const numberBets: Record<string, { count: number; amount: number }> = {};
      
      // Initialize all numbers 0-9
      for (let i = 0; i <= 9; i++) {
        numberBets[i.toString()] = { count: 0, amount: 0 };
      }

      // Count actual bets
      bets?.forEach(bet => {
        if (bet.bet_type === 'number') {
          const number = bet.bet_value;
          if (numberBets[number]) {
            numberBets[number].count += 1;
            numberBets[number].amount += bet.amount || 0;
          }
        }
      });

      const stats: LiveGameStats = {
        activeGame,
        activePlayers,
        totalBets,
        totalBetAmount,
        numberBets
      };

      console.log('✅ Game stats loaded successfully:', {
        gameNumber: activeGame.game_number,
        activePlayers,
        totalBets,
        totalBetAmount
      });

      return stats;

    } catch (error) {
      console.error('❌ Error loading game stats:', error);
      throw error;
    }
  }

  static async logAdminAction(action: string, details: any = {}) {
    return AdminLoggingService.logAdminAction(action, details);
  }
}
