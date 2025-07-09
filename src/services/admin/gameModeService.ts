
import { supabase } from '@/integrations/supabase/client';

export class GameModeService {
  static async setGameMode(gameId: string, mode: 'automatic' | 'manual'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('games')
        .update({
          game_mode_type: mode,
          admin_controlled: mode === 'manual'
        })
        .eq('id', gameId);

      if (error) {
        console.error('Error setting game mode:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in setGameMode:', error);
      return false;
    }
  }
}
