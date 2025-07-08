
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export class AdminService {
  // Simple admin login
  static async login(email: string, password: string) {
    try {
      console.log('🔐 Admin login attempt:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Login failed:', error);
        return { success: false, error };
      }

      if (!data.user) {
        console.error('❌ No user returned');
        return { success: false, error: { message: 'Login failed' } };
      }

      // Check if user is admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (userError || userData?.role !== 'admin') {
        console.error('❌ Not an admin user');
        await supabase.auth.signOut();
        return { success: false, error: { message: 'Admin access required' } };
      }

      console.log('✅ Admin login successful');
      return { success: true, user: data.user };
    } catch (error) {
      console.error('❌ Login exception:', error);
      return { success: false, error };
    }
  }

  // Check if current user is admin
  static async isAdmin(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return false;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      return userData?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Get all users
  static async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      return { data: data || [], error };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { data: [], error };
    }
  }

  // Get all games
  static async getAllGames() {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      return { data: data || [], error };
    } catch (error) {
      console.error('Error fetching games:', error);
      return { data: [], error };
    }
  }

  // Get all bets
  static async getAllBets() {
    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          users!inner(username, email),
          games!inner(game_number, status)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      return { data: data || [], error };
    } catch (error) {
      console.error('Error fetching bets:', error);
      return { data: [], error };
    }
  }

  // Update user balance
  static async updateUserBalance(userId: string, newBalance: number) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (error) {
        toast.error('Failed to update balance');
        return { success: false, error };
      }

      toast.success('Balance updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error updating balance:', error);
      toast.error('Failed to update balance');
      return { success: false, error };
    }
  }

  // Simple logout
  static async logout() {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      window.location.href = '/admin-login';
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  }

  // Get admin info
  static async getAdminInfo() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return null;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('username, email')
        .eq('id', session.user.id)
        .single();

      return {
        username: userData?.username || 'Admin',
        email: userData?.email || session.user.email,
        id: session.user.id
      };
    } catch (error) {
      console.error('Error getting admin info:', error);
      return null;
    }
  }
}
