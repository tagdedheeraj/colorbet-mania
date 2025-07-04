
import { supabase } from '@/integrations/supabase/client';

export class AdminService {
  static async isAdmin(userId: string): Promise<boolean> {
    // Since there's no role column in profiles, we'll use a hardcoded admin check
    // In a real app, you'd want to add a role column to profiles table
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (error) return false;
      
      // Simple admin check - in production you'd want proper role management
      return data?.email === 'admin@example.com';
    } catch (error) {
      return false;
    }
  }

  static async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
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
        .from('game_periods')
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
          profiles!inner(email)
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
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  static async logAdminAction(action: string, targetType?: string, targetId?: string, details?: any) {
    // Since admin_logs table doesn't exist, we'll just log to console
    // In production, you'd want to create an admin_logs table
    console.log('Admin Action:', {
      action,
      targetType,
      targetId,
      details,
      timestamp: new Date().toISOString()
    });
    
    return { error: null };
  }
}
