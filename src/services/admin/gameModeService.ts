
import { supabase } from '@/integrations/supabase/client';

export class GameModeService {
  static async setGameMode(gameId: string, mode: 'automatic' | 'manual'): Promise<boolean> {
    try {
      console.log('🔄 Setting game mode:', { gameId, mode });

      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('❌ Auth error in setGameMode:', authError);
        return false;
      }
      
      if (!user) {
        console.error('❌ No authenticated user found for setGameMode');
        return false;
      }

      // Verify admin user
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('id, role, email')
        .eq('id', user.id)
        .eq('role', 'admin')
        .single();

      if (adminError || !adminUser) {
        console.error('❌ Admin validation failed for setGameMode:', adminError);
        return false;
      }

      console.log('✅ Admin validated for setGameMode:', adminUser.email);

      const { error } = await supabase
        .from('games')
        .update({
          game_mode_type: mode,
          admin_controlled: mode === 'manual'
        })
        .eq('id', gameId);

      if (error) {
        console.error('❌ Error setting game mode:', error);
        return false;
      }

      console.log('✅ Game mode set successfully:', mode);
      return true;
    } catch (error) {
      console.error('❌ Error in setGameMode:', error);
      return false;
    }
  }
}
