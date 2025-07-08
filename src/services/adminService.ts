
import { supabase } from '@/integrations/supabase/client';

export class AdminService {
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      return data?.role === 'admin';
    } catch (error) {
      console.error('Error in isAdmin:', error);
      return false;
    }
  }

  static async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return { data: [], error };
    }
  }

  static async getAllGames() {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching games:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getAllGames:', error);
      return { data: [], error };
    }
  }

  static async getAllBets() {
    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          users!inner(email, username)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching bets:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getAllBets:', error);
      return { data: [], error };
    }
  }

  static async updateUserBalance(userId: string, newBalance: number) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('Error updating balance:', error);
      }

      return { error };
    } catch (error) {
      console.error('Error in updateUserBalance:', error);
      return { error };
    }
  }

  static async logAdminAction(action: string, targetType?: string, targetId?: string, details?: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('admin_logs')
        .insert({
          admin_user_id: user?.id || 'unknown',
          action,
          target_type: targetType,
          target_id: targetId,
          details
        });
      
      if (error) {
        console.error('Error logging admin action:', error);
      }

      return { error };
    } catch (error) {
      console.error('Error in logAdminAction:', error);
      return { error };
    }
  }
}
