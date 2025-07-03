
import { supabase } from '@/integrations/supabase/client';

export class AdminService {
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) return false;
      return data?.role === 'admin';
    } catch (error) {
      return false;
    }
  }

  static async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      return { data: data || [], error };
    } catch (error) {
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

      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  }

  static async getAllBets() {
    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          users!inner(username, email),
          games!inner(game_number, result_color, result_number)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  }

  static async updateUserBalance(userId: string, newBalance: number) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  static async logAdminAction(action: string, targetType?: string, targetId?: string, details?: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { error: 'No authenticated user' };
      }

      const { error } = await supabase
        .from('admin_logs')
        .insert({
          admin_user_id: user.id,
          action,
          target_type: targetType,
          target_id: targetId,
          details
        });

      return { error };
    } catch (error) {
      return { error };
    }
  }
}
