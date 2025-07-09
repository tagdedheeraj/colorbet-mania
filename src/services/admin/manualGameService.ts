
import { supabase } from '@/integrations/supabase/client';
import { DatabaseResponse } from '@/types/adminGame';

export class ManualGameService {
  static async setManualResult(gameId: string, number: number): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        return false;
      }

      // Use the new database function
      const { data, error } = await supabase.rpc('set_manual_game_result', {
        p_game_id: gameId,
        p_admin_user_id: user.id,
        p_result_number: number
      });

      if (error) {
        console.error('Error setting manual result:', error);
        return false;
      }

      const response = data as unknown as DatabaseResponse;
      if (response && !response.success) {
        console.error('Manual result setting failed:', response.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in setManualResult:', error);
      return false;
    }
  }

  static async completeGameManually(gameId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        return false;
      }

      // Use the new database function
      const { data, error } = await supabase.rpc('complete_manual_game', {
        p_game_id: gameId,
        p_admin_user_id: user.id
      });

      if (error) {
        console.error('Error completing game manually:', error);
        return false;
      }

      const response = data as unknown as DatabaseResponse;
      if (response && !response.success) {
        console.error('Manual game completion failed:', response.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in completeGameManually:', error);
      return false;
    }
  }
}
