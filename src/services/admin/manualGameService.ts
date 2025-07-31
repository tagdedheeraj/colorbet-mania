
import { supabase } from '@/integrations/supabase/client';
import { DatabaseResponse } from '@/types/adminGame';

export class ManualGameService {
  static async setManualResult(gameId: string, number: number): Promise<boolean> {
    try {
      console.log('🎯 Setting manual result with enhanced function:', { gameId, number });
      
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
        return false;
      }

      console.log('✅ Admin user validated:', adminUser);

      // Use the enhanced database function to set manual result
      const { data, error } = await supabase.rpc('set_manual_result_enhanced', {
        p_game_id: gameId,
        p_admin_user_id: user.id,
        p_result_number: number
      });

      console.log('📡 Enhanced database function response:', { data, error });

      if (error) {
        console.error('❌ Enhanced database function error:', error);
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
        console.error('❌ Error parsing response:', parseError);
        return false;
      }

      console.log('📋 Parsed response:', response);

      if (response && !response.success) {
        console.error('❌ Manual result setting failed:', response.message);
        if (response.debug_info) {
          console.error('🔍 Debug info:', response.debug_info);
        }
        return false;
      }

      console.log('✅ Manual result set successfully using enhanced function');
      return true;

    } catch (error) {
      console.error('❌ Exception in setManualResult:', error);
      return false;
    }
  }

  static async completeGameManually(gameId: string): Promise<boolean> {
    try {
      console.log('🏁 Completing game manually with enhanced function:', gameId);
      
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

      // Use the enhanced database function to complete game
      const { data, error } = await supabase.rpc('complete_manual_game_enhanced', {
        p_game_id: gameId,
        p_admin_user_id: user.id
      });

      console.log('📡 Enhanced complete game response:', { data, error });

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

      console.log('✅ Game completed manually using enhanced function');
      return true;

    } catch (error) {
      console.error('❌ Exception in completeGameManually:', error);
      return false;
    }
  }

  static async setManualMode(gameId: string, enable: boolean): Promise<boolean> {
    try {
      console.log('🔄 Setting manual mode with enhanced function:', { gameId, enable });
      
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

      // Use the enhanced database function to set manual mode
      const { data, error } = await supabase.rpc('set_manual_mode_enhanced', {
        p_game_id: gameId,
        p_admin_user_id: user.id,
        p_enable_manual: enable
      });

      console.log('📡 Enhanced manual mode response:', { data, error });

      if (error) {
        console.error('❌ Enhanced manual mode function error:', error);
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
        console.error('❌ Error parsing manual mode response:', parseError);
        return false;
      }

      console.log('📋 Parsed manual mode response:', response);

      if (response && !response.success) {
        console.error('❌ Manual mode setting failed:', response.message);
        return false;
      }

      console.log('✅ Manual mode set successfully using enhanced function');
      return true;

    } catch (error) {
      console.error('❌ Exception in setManualMode:', error);
      return false;
    }
  }

  static async checkGameManualStatus(gameId: string): Promise<boolean> {
    try {
      console.log('🔍 Checking game manual status:', gameId);
      
      const { data, error } = await supabase.rpc('is_game_manual', {
        p_game_id: gameId
      });

      if (error) {
        console.error('❌ Error checking manual status:', error);
        return false;
      }

      console.log('📊 Game manual status:', data);
      return data || false;

    } catch (error) {
      console.error('❌ Exception in checkGameManualStatus:', error);
      return false;
    }
  }
}
