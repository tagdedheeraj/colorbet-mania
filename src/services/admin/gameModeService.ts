
import { supabase } from '@/integrations/supabase/client';
import AdminAuthService from '@/services/adminAuthService';

export class GameModeService {
  static async setGameMode(gameId: string, mode: 'automatic' | 'manual'): Promise<boolean> {
    try {
      console.log('🔄 Setting game mode using direct table update:', { gameId, mode });

      const adminUser = await AdminAuthService.getCurrentAdminUser();
      if (!adminUser) {
        console.error('❌ No authenticated admin user found');
        return false;
      }

      console.log('✅ Admin user validated:', adminUser.email);

      // Update game mode directly in the database
      const updateData: any = { game_mode: mode };
      
      // Try to set admin_controlled if column exists
      try {
        updateData.admin_controlled = mode === 'manual';
      } catch (e) {
        // Column may not exist, continue without it
      }

      const { data, error } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', gameId);

      if (error) {
        console.error('❌ Database update error:', error);
        return false;
      }

      console.log('✅ Game mode set successfully using direct update');
      return true;

    } catch (error) {
      console.error('❌ Exception in setGameMode:', error);
      return false;
    }
  }
}
