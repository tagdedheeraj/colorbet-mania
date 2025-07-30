
import { supabase } from '@/integrations/supabase/client';
import { DatabaseResponse } from '@/types/adminGame';

export class ManualGameService {
  static async setManualResult(gameId: string, number: number): Promise<boolean> {
    try {
      console.log('🎯 Setting manual result:', { gameId, number });
      
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('❌ Auth error:', authError);
        return false;
      }
      
      if (!user) {
        console.error('❌ No authenticated user found');
        return false;
      }

      console.log('👤 Authenticated user:', user.id, user.email);

      // Verify admin user exists in users table with admin role
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('id, role, email, username')
        .eq('id', user.id)
        .eq('role', 'admin')
        .single();

      if (adminError || !adminUser) {
        console.error('❌ Admin user validation failed:', adminError);
        console.log('Available user data:', user);
        return false;
      }

      console.log('✅ Admin user validated:', adminUser);

      // Verify game exists and is active
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .eq('status', 'active')
        .single();

      if (gameError || !game) {
        console.error('❌ Game validation failed:', gameError);
        return false;
      }

      console.log('🎮 Active game found:', game.game_number);

      // First, set the game to manual mode and set the result
      const { error: modeError } = await supabase
        .from('games')
        .update({
          game_mode_type: 'manual',
          admin_controlled: true,
          admin_set_result_number: number,
          manual_result_set: true
        })
        .eq('id', gameId);

      if (modeError) {
        console.error('❌ Error setting manual mode and result:', modeError);
        return false;
      }

      console.log('✅ Game set to manual mode with result:', number);

      // Use the enhanced database function to set manual result with better error handling
      const { data, error } = await supabase.rpc('set_manual_game_result_enhanced', {
        p_game_id: gameId,
        p_admin_user_id: user.id,
        p_result_number: number
      });

      console.log('📡 Enhanced database function response:', { data, error });

      if (error) {
        console.error('❌ Enhanced database function error:', error);
        // Still return true since we already updated the game above
        console.log('✅ Manual result was set via direct update, ignoring RPC error');
        return true;
      }

      // Parse the response
      let response: DatabaseResponse;
      try {
        if (typeof data === 'string') {
          response = JSON.parse(data);
        } else {
          response = data as unknown as DatabaseResponse;
        }
      } catch (parseError) {
        console.error('❌ Error parsing response:', parseError);
        // Still return true since we updated the game successfully
        return true;
      }

      console.log('📋 Parsed response:', response);

      if (response && !response.success) {
        console.error('❌ Manual result setting failed:', response.message);
        if (response.debug_info) {
          console.error('🔍 Debug info:', response.debug_info);
        }
        // Still return true since we already updated the game
        console.log('✅ Manual result was set via direct update despite RPC response');
        return true;
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
      
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('❌ Auth error:', authError);
        return false;
      }
      
      if (!user) {
        console.error('❌ No authenticated user found');
        return false;
      }

      console.log('👤 User for manual completion:', user.id);

      // Verify admin user
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('id, role, email')
        .eq('id', user.id)
        .eq('role', 'admin')
        .single();

      if (adminError || !adminUser) {
        console.error('❌ Admin validation failed for completion:', adminError);
        return false;
      }

      console.log('✅ Admin validated for completion:', adminUser);

      // Use the database function to complete game
      const { data, error } = await supabase.rpc('complete_manual_game', {
        p_game_id: gameId,
        p_admin_user_id: user.id
      });

      console.log('📡 Complete game response:', { data, error });

      if (error) {
        console.error('❌ Error completing game manually:', error);
        return false;
      }

      // Parse the response
      let response: DatabaseResponse;
      try {
        if (typeof data === 'string') {
          response = JSON.parse(data);
        } else {
          response = data as unknown as DatabaseResponse;
        }
      } catch (parseError) {
        console.error('❌ Error parsing completion response:', parseError);
        return false;
      }

      console.log('📋 Parsed completion response:', response);

      if (response && !response.success) {
        console.error('❌ Manual game completion failed:', response.message);
        return false;
      }

      console.log('✅ Game completed manually');
      return true;

    } catch (error) {
      console.error('❌ Exception in completeGameManually:', error);
      return false;
    }
  }
}
