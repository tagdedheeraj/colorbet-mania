
import { supabase } from '@/integrations/supabase/client';

export class AdminLoggingService {
  static async logAdminAction(action: string, details: any = {}) {
    try {
      console.log('📝 Logging admin action:', { action, details });

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('❌ Auth error in logAdminAction:', authError);
        return;
      }
      
      if (!user) {
        console.error('❌ No authenticated user found for logging');
        return;
      }

      // Verify admin user
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('id, role, email')
        .eq('id', user.id)
        .eq('role', 'admin')
        .single();

      if (adminError || !adminUser) {
        console.error('❌ Admin validation failed for logging:', adminError);
        return;
      }

      const { error: logError } = await supabase
        .from('admin_logs')
        .insert({
          admin_user_id: user.id,
          action,
          details
        });

      if (logError) {
        console.error('❌ Error logging admin action:', logError);
      } else {
        console.log('✅ Admin action logged successfully');
      }
    } catch (error) {
      console.error('❌ Exception in logAdminAction:', error);
    }
  }
}
