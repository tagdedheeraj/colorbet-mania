
import { supabase } from '@/integrations/supabase/client';
import AdminAuthService from '@/services/adminAuthService';

export class EnhancedManualGameService {
  static async setManualMode(gameId: string, enable: boolean): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🔄 Enhanced: Setting manual mode:', { gameId, enable });
      
      const adminUser = await AdminAuthService.getCurrentAdminUser();
      if (!adminUser) {
        console.error('❌ Enhanced: No authenticated admin user found');
        return { success: false, message: 'Admin authentication required' };
      }

      console.log('✅ Enhanced: Admin user validated:', adminUser.email);

      // Update the game directly
      const updateData: any = { game_mode: enable ? 'manual' : 'automatic' };
      
      // Try to update admin_controlled column if it exists
      if (enable) {
        updateData.admin_controlled = true;
      }

      const { data, error } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', gameId)
        .select()
        .single();

      console.log('📡 Enhanced: Manual mode response:', { data, error });

      if (error) {
        console.error('❌ Enhanced: Database error:', error);
        return { success: false, message: `Database error: ${error.message}` };
      }

      console.log('✅ Enhanced: Manual mode set successfully');
      return { 
        success: true, 
        message: `Game ${enable ? 'switched to manual mode' : 'switched to automatic mode'}`,
        data
      };

    } catch (error) {
      console.error('❌ Enhanced: Exception in setManualMode:', error);
      return { success: false, message: `System error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  static async setManualResult(gameId: string, number: number): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🎯 Enhanced: Setting manual result:', { gameId, number });
      
      if (number < 0 || number > 9) {
        return { success: false, message: 'Number must be between 0 and 9' };
      }

      const adminUser = await AdminAuthService.getCurrentAdminUser();
      if (!adminUser) {
        console.error('❌ Enhanced: No authenticated admin user for result setting');
        return { success: false, message: 'Admin authentication required' };
      }

      console.log('✅ Enhanced: Admin user for result setting:', adminUser.email);

      const getColorForNumber = (num: number): string => {
        if ([1, 3, 7, 9].includes(num)) return 'red';
        if ([2, 4, 6, 8].includes(num)) return 'green';
        if ([0, 5].includes(num)) return 'purple-red';
        return 'red';
      };

      const color = getColorForNumber(number);

      // Update the game with manual result
      const updateData: any = {
        admin_set_result_number: number,
        admin_set_result_color: color,
        result_number: number,
        result_color: color
      };

      // Try to set manual_result_set flag if column exists
      try {
        updateData.manual_result_set = true;
      } catch (e) {
        // Column may not exist, continue without it
      }

      const { data, error } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', gameId)
        .select()
        .single();

      console.log('📡 Enhanced: Manual result response:', { data, error });

      if (error) {
        console.error('❌ Enhanced: Database error setting result:', error);
        return { success: false, message: `Database error: ${error.message}` };
      }

      console.log('✅ Enhanced: Manual result set successfully:', data);
      return { 
        success: true, 
        message: `Result set to ${number} successfully`,
        data
      };

    } catch (error) {
      console.error('❌ Enhanced: Exception in setManualResult:', error);
      return { success: false, message: `System error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  static async completeGameManually(gameId: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🏁 Enhanced: Completing game manually:', gameId);
      
      const adminUser = await AdminAuthService.getCurrentAdminUser();
      if (!adminUser) {
        console.error('❌ Enhanced: No authenticated admin user for completion');
        return { success: false, message: 'Admin authentication required' };
      }

      console.log('✅ Enhanced: Admin user for completion:', adminUser.email);

      const { data, error } = await supabase
        .from('games')
        .update({
          status: 'completed',
          end_time: new Date().toISOString()
        })
        .eq('id', gameId)
        .select()
        .single();

      console.log('📡 Enhanced: Game completion response:', { data, error });

      if (error) {
        console.error('❌ Enhanced: Database error completing game:', error);
        return { success: false, message: `Database error: ${error.message}` };
      }

      console.log('✅ Enhanced: Game completed successfully:', data);
      return { 
        success: true, 
        message: 'Game completed successfully',
        data
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
        .select('game_mode, is_result_locked, admin_set_result_number')
        .eq('id', gameId)
        .single();

      if (error) {
        console.error('❌ Enhanced: Error checking game status:', error);
        return { isManual: false, timerPaused: false, resultSet: false, error: error.message };
      }

      const status = {
        isManual: game?.game_mode === 'manual',
        timerPaused: game?.is_result_locked || false,
        resultSet: game?.admin_set_result_number !== null
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
