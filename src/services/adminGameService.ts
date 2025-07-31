
import { supabase } from '@/integrations/supabase/client';
import { ManualGameService } from './admin/manualGameService';
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
  // Enhanced method using the new GameModeService with manual mode support
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
        
        console.log('✅ Game mode set successfully with enhanced service');
      }
      
      return success;
    } catch (error) {
      console.error('❌ AdminGameService: Error in setGameMode:', error);
      return false;
    }
  }

  static async setManualResult(gameId: string, number: number): Promise<boolean> {
    try {
      console.log('🎯 AdminGameService: Setting manual result via enhanced service:', { gameId, number });
      
      const success = await ManualGameService.setManualResult(gameId, number);
      
      if (success) {
        await AdminLoggingService.logAdminAction('set_manual_result', {
          game_id: gameId,
          result_number: number,
          method: 'enhanced_service'
        });
        
        console.log('✅ Manual result set successfully with enhanced service');
      }
      
      return success;
    } catch (error) {
      console.error('❌ AdminGameService: Error in setManualResult:', error);
      return false;
    }
  }

  static async completeGameManually(gameId: string): Promise<boolean> {
    try {
      console.log('🏁 AdminGameService: Completing game manually via enhanced service:', gameId);
      
      const success = await ManualGameService.completeGameManually(gameId);
      
      if (success) {
        await AdminLoggingService.logAdminAction('complete_game_manually', {
          game_id: gameId,
          method: 'enhanced_service'
        });
        
        console.log('✅ Game completed manually with enhanced service');
      }
      
      return success;
    } catch (error) {
      console.error('❌ AdminGameService: Error in completeGameManually:', error);
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
        totalBetAmount,
        isManual: activeGame.admin_controlled,
        timerPaused: activeGame.timer_paused
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
