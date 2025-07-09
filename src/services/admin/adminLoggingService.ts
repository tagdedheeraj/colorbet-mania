
import { supabase } from '@/integrations/supabase/client';

export class AdminLoggingService {
  static async logAdminAction(action: string, details: any = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('admin_logs')
        .insert({
          admin_user_id: user?.id || 'unknown',
          action,
          details
        });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }
}
