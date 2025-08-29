
import { supabase } from '@/integrations/supabase/client';
import AdminAuthService from '@/services/adminAuthService';

export class ManualGameService {
  static async setManualResult(gameId: string, number: number): Promise<boolean> {
    try {
      console.log('🎯 Setting manual result:', { gameId, number });
      
      const adminUser = await AdminAuthService.getCurrentAdminUser();
      if (!adminUser) {
        console.error('❌ No authenticated admin user found');
        return false;
      }

      console.log('✅ Admin user validated:', adminUser.email);

      const getColorForNumber = (num: number): string => {
        if ([1, 3, 7, 9].includes(num)) return 'red';
        if ([2, 4, 6, 8].includes(num)) return 'green';
        if ([0, 5].includes(num)) return 'purple-red';
        return 'red';
      };

      const color = getColorForNumber(number);

      // Update game with manual result
      const { data, error } = await supabase
        .from('games')
        .update({
          admin_set_result_number: number,
          admin_set_result_color: color,
          result_number: number,
          result_color: color
        })
        .eq('id', gameId)
        .select()
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        return false;
      }

      console.log('✅ Manual result set successfully');
      return true;

    } catch (error) {
      console.error('❌ Exception in setManualResult:', error);
      return false;
    }
  }

  static async completeGameManually(gameId: string): Promise<boolean> {
    try {
      console.log('🏁 Completing game manually:', gameId);
      
      const adminUser = await AdminAuthService.getCurrentAdminUser();
      if (!adminUser) {
        console.error('❌ No authenticated admin user found');
        return false;
      }

      console.log('✅ Admin user validated:', adminUser.email);

      // Complete the game
      const { data, error } = await supabase
        .from('games')
        .update({
          status: 'completed',
          end_time: new Date().toISOString()
        })
        .eq('id', gameId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error completing game:', error);
        return false;
      }

      console.log('✅ Game completed manually');
      return true;

    } catch (error) {
      console.error('❌ Exception in completeGameManually:', error);
      return false;
    }
  }

  static async setManualMode(gameId: string, enable: boolean): Promise<boolean> {
    try {
      console.log('🔄 Setting manual mode:', { gameId, enable });
      
      const adminUser = await AdminAuthService.getCurrentAdminUser();
      if (!adminUser) {
        console.error('❌ No authenticated admin user found');
        return false;
      }

      // Update the game mode
      const { data, error } = await supabase
        .from('games')
        .update({
          game_mode: enable ? 'manual' : 'automatic'
        })
        .eq('id', gameId)
        .select()
        .single();

      if (error) {
        console.error('❌ Manual mode update error:', error);
        return false;
      }

      console.log('✅ Manual mode set successfully');
      return true;

    } catch (error) {
      console.error('❌ Exception in setManualMode:', error);
      return false;
    }
  }

  static async checkGameManualStatus(gameId: string): Promise<boolean> {
    try {
      console.log('🔍 Checking game manual status:', gameId);
      
      const { data, error } = await supabase
        .from('games')
        .select('game_mode')
        .eq('id', gameId)
        .single();

      if (error) {
        console.error('❌ Error checking manual status:', error);
        return false;
      }

      const isManual = data?.game_mode === 'manual';
      console.log('📊 Game manual status:', isManual);
      return isManual;

    } catch (error) {
      console.error('❌ Exception in checkGameManualStatus:', error);
      return false;
    }
  }
}
