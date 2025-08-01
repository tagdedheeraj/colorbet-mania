
import { supabase } from '@/integrations/supabase/client';
import { DatabaseResponse } from '@/types/adminGame';
import AdminAuthService from '@/services/adminAuthService';

export class EnhancedManualGameService {
  static async setManualMode(gameId: string, enable: boolean): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🔄 Enhanced: Setting manual mode:', { gameId, enable });
      
      // Get authenticated admin user
      const adminUser = await AdminAuthService.getCurrentAdminUser();
      if (!adminUser) {
        console.error('❌ Enhanced: No authenticated admin user found');
        return { success: false, message: 'Admin authentication required' };
      }

      console.log('✅ Enhanced: Admin user validated:', adminUser.email);

      // Use enhanced database function
      const { data, error } = await supabase.rpc('set_manual_mode_enhanced', {
        p_game_id: gameId,
        p_admin_user_id: adminUser.id,
        p_enable_manual: enable
      });

      console.log('📡 Enhanced: Manual mode response:', { data, error });

      if (error) {
        console.error('❌ Enhanced: Database error:', error);
        return { success: false, message: `Database error: ${error.message}` };
      }

      let response: DatabaseResponse;
      try {
        response = typeof data === 'string' ? JSON.parse(data) : data;
      } catch (parseError) {
        console.error('❌ Enhanced: Response parsing error:', parseError);
        return { success: false, message: 'Invalid response format' };
      }

      if (!response?.success) {
        console.error('❌ Enhanced: Operation failed:', response?.message);
        return { success: false, message: response?.message || 'Unknown error' };
      }

      console.log('✅ Enhanced: Manual mode set successfully');
      return { 
        success: true, 
        message: `Game ${enable ? 'switched to manual mode' : 'switched to automatic mode'}`,
        data: response
      };

    } catch (error) {
      console.error('❌ Enhanced: Exception in setManualMode:', error);
      return { success: false, message: `System error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  static async setManualResult(gameId: string, number: number): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🎯 Enhanced: Setting manual result:', { gameId, number });
      
      // Validate input
      if (number < 0 || number > 9) {
        return { success: false, message: 'Number must be between 0 and 9' };
      }

      // Get authenticated admin user
      const adminUser = await AdminAuthService.getCurrentAdminUser();
      if (!adminUser) {
        console.error('❌ Enhanced: No authenticated admin user for result setting');
        return { success: false, message: 'Admin authentication required' };
      }

      console.log('✅ Enhanced: Admin user for result setting:', adminUser.email);

      // Use enhanced database function
      const { data, error } = await supabase.rpc('set_manual_result_enhanced', {
        p_game_id: gameId,
        p_admin_user_id: adminUser.id,
        p_result_number: number
      });

      console.log('📡 Enhanced: Manual result response:', { data, error });

      if (error) {
        console.error('❌ Enhanced: Database error setting result:', error);
        return { success: false, message: `Database error: ${error.message}` };
      }

      let response: DatabaseResponse;
      try {
        response = typeof data === 'string' ? JSON.parse(data) : data;
      } catch (parseError) {
        console.error('❌ Enhanced: Result response parsing error:', parseError);
        return { success: false, message: 'Invalid response format' };
      }

      if (!response?.success) {
        console.error('❌ Enhanced: Result setting failed:', response?.message);
        return { success: false, message: response?.message || 'Failed to set result' };
      }

      console.log('✅ Enhanced: Manual result set successfully:', response);
      return { 
        success: true, 
        message: `Result set to ${number} successfully`,
        data: response
      };

    } catch (error) {
      console.error('❌ Enhanced: Exception in setManualResult:', error);
      return { success: false, message: `System error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  static async completeGameManually(gameId: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🏁 Enhanced: Completing game manually:', gameId);
      
      // Get authenticated admin user
      const adminUser = await AdminAuthService.getCurrentAdminUser();
      if (!adminUser) {
        console.error('❌ Enhanced: No authenticated admin user for completion');
        return { success: false, message: 'Admin authentication required' };
      }

      console.log('✅ Enhanced: Admin user for completion:', adminUser.email);

      // Use enhanced database function
      const { data, error } = await supabase.rpc('complete_manual_game_enhanced', {
        p_game_id: gameId,
        p_admin_user_id: adminUser.id
      });

      console.log('📡 Enhanced: Game completion response:', { data, error });

      if (error) {
        console.error('❌ Enhanced: Database error completing game:', error);
        return { success: false, message: `Database error: ${error.message}` };
      }

      let response: DatabaseResponse;
      try {
        response = typeof data === 'string' ? JSON.parse(data) : data;
      } catch (parseError) {
        console.error('❌ Enhanced: Completion response parsing error:', parseError);
        return { success: false, message: 'Invalid response format' };
      }

      if (!response?.success) {
        console.error('❌ Enhanced: Game completion failed:', response?.message);
        return { success: false, message: response?.message || 'Failed to complete game' };
      }

      console.log('✅ Enhanced: Game completed successfully:', response);
      return { 
        success: true, 
        message: 'Game completed successfully',
        data: response
      };

    } catch (error) {
      console.error('❌ Enhanced: Exception in completeGameManually:', error);
      return { success: false, message: `System error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  static async checkGameStatus(gameId: string): Promise<{ isManual: boolean; timerPaused: boolean; resultSet: boolean; error?: string }> {
    try {
      console.log('🔍 Enhanced: Checking game status:', gameId);
      
      const { data: game, error } = await supabase
        .from('games')
        .select('admin_controlled, timer_paused, manual_result_set, admin_set_result_number')
        .eq('id', gameId)
        .single();

      if (error) {
        console.error('❌ Enhanced: Error checking game status:', error);
        return { isManual: false, timerPaused: false, resultSet: false, error: error.message };
      }

      const status = {
        isManual: game?.admin_controlled || false,
        timerPaused: game?.timer_paused || false,
        resultSet: game?.manual_result_set || false
      };

      console.log('📊 Enhanced: Game status:', status);
      return status;

    } catch (error) {
      console.error('❌ Enhanced: Exception checking game status:', error);
      return { 
        isManual: false, 
        timerPaused: false, 
        resultSet: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
