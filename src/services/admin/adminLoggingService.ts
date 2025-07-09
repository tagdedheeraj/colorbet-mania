
import { supabase } from '@/integrations/supabase/client';
import AdminAuthService from '@/services/adminAuthService';

export class AdminLoggingService {
  static async logAdminAction(action: string, details: any = {}) {
    try {
      console.log('📝 Logging admin action with enhanced auth:', { action, details });

      // Get current admin user
      const adminUser = await AdminAuthService.getCurrentAdminUser();
      if (!adminUser) {
        console.error('❌ No authenticated admin user found for logging');
        return;
      }

      console.log('✅ Admin user validated for logging:', adminUser.email);

      const { error: logError } = await supabase
        .from('admin_logs')
        .insert({
          admin_user_id: adminUser.id,
          action,
          details: {
            ...details,
            admin_email: adminUser.email,
            timestamp: new Date().toISOString()
          }
        });

      if (logError) {
        console.error('❌ Error logging admin action:', logError);
      } else {
        console.log('✅ Admin action logged successfully');
      }
    } catch (error) {
      console.error('❌ Exception in enhanced logAdminAction:', error);
    }
  }
}
