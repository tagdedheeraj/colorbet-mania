
import { supabase } from '@/integrations/supabase/client';
import AdminAuthService from '@/services/adminAuthService';

export class GameModeService {
  static async setGameMode(gameId: string, mode: 'automatic' | 'manual'): Promise<boolean> {
    try {
      console.log('🔄 Setting game mode using enhanced method:', { gameId, mode });

      // Get current admin user
      const adminUser = await AdminAuthService.getCurrentAdminUser();
      if (!adminUser) {
        console.error('❌ No authenticated admin user found');
        return false;
      }

      console.log('✅ Admin user validated:', adminUser.email);

      // Use enhanced database function
      const { data, error } = await supabase.rpc('set_manual_mode_enhanced', {
        p_game_id: gameId,
        p_admin_user_id: adminUser.id,
        p_enable_manual: mode === 'manual'
      });

      console.log('📡 Enhanced database function response:', { data, error });

      if (error) {
        console.error('❌ Enhanced database function error:', error);
        return false;
      }

      // Parse the response
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

      console.log('📋 Parsed response:', response);

      if (response && !response.success) {
        console.error('❌ Game mode setting failed:', response.message);
        return false;
      }

      console.log('✅ Game mode set successfully using enhanced method');
      return true;

    } catch (error) {
      console.error('❌ Exception in enhanced setGameMode:', error);
      return false;
    }
  }
}
