
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export class AdminService {
  // Enhanced admin login with better error handling
  static async login(email: string, password: string) {
    try {
      console.log('🔐 Starting admin login for:', email);
      
      // First, ensure we're logged out completely
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log('✅ Previous session cleared');
      } catch (err) {
        console.log('ℹ️ No previous session to clear');
      }

      // Clear any stored auth data
      localStorage.removeItem('supabase.auth.token');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });

      console.log('🔄 Attempting login...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        console.error('❌ Supabase auth error:', error);
        toast.error(`Login failed: ${error.message}`);
        return { success: false, error };
      }

      if (!data.user) {
        console.error('❌ No user returned from Supabase');
        toast.error('Login failed - no user data');
        return { success: false, error: { message: 'No user data returned' } };
      }

      console.log('✅ Supabase auth successful, checking admin role...');

      // Check if user exists in our users table and has admin role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, username, email, id')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        console.error('❌ Error checking user role:', userError);
        await supabase.auth.signOut();
        toast.error('Admin verification failed');
        return { success: false, error: userError };
      }

      if (!userData) {
        console.error('❌ User not found in users table');
        await supabase.auth.signOut();
        toast.error('Admin user not found');
        return { success: false, error: { message: 'User not found' } };
      }

      if (userData.role !== 'admin') {
        console.error('❌ User is not admin, role:', userData.role);
        await supabase.auth.signOut();
        toast.error('Admin access required');
        return { success: false, error: { message: 'Admin access required' } };
      }

      console.log('✅ Admin login completely successful!');
      toast.success('Admin login successful!');
      return { success: true, user: data.user, userData };

    } catch (error) {
      console.error('❌ Login exception:', error);
      toast.error('System error during login');
      return { success: false, error };
    }
  }

  // Enhanced admin check
  static async isAdmin(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('❌ No active session');
        return false;
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || !userData) {
        console.error('❌ Error checking admin status:', error);
        return false;
      }

      const isAdmin = userData.role === 'admin';
      console.log('🔍 Admin check result:', isAdmin);
      return isAdmin;
    } catch (error) {
      console.error('❌ Admin check exception:', error);
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

      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      }

      return { data: data || [], error };
    } catch (error) {
      console.error('Exception fetching users:', error);
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

      if (error) {
        console.error('Error fetching games:', error);
        toast.error('Failed to load games');
      }

      return { data: data || [], error };
    } catch (error) {
      console.error('Exception fetching games:', error);
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

      if (error) {
        console.error('Error fetching bets:', error);
        toast.error('Failed to load bets');
      }

      return { data: data || [], error };
    } catch (error) {
      console.error('Exception fetching bets:', error);
      return { data: [], error };
    }
  }

  // Update user balance
  static async updateUserBalance(userId: string, newBalance: number) {
    try {
      console.log('💰 Updating balance for user:', userId, 'to:', newBalance);

      const { error } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (error) {
        console.error('❌ Balance update error:', error);
        toast.error('Failed to update balance');
        return { success: false, error };
      }

      console.log('✅ Balance updated successfully');
      toast.success('Balance updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Balance update exception:', error);
      toast.error('Failed to update balance');
      return { success: false, error };
    }
  }

  // Enhanced logout
  static async logout() {
    try {
      console.log('🚪 Logging out admin...');
      
      // Clear local storage
      localStorage.removeItem('supabase.auth.token');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });

      await supabase.auth.signOut({ scope: 'global' });
      toast.success('Logged out successfully');
      
      // Force redirect
      setTimeout(() => {
        window.location.href = '/admin-login';
      }, 100);
    } catch (error) {
      console.error('❌ Logout error:', error);
      toast.error('Logout failed');
      window.location.href = '/admin-login';
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
        .select('username, email, role')
        .eq('id', session.user.id)
        .single();

      return {
        username: userData?.username || 'Admin',
        email: userData?.email || session.user.email,
        id: session.user.id,
        role: userData?.role
      };
    } catch (error) {
      console.error('Error getting admin info:', error);
      return null;
    }
  }
}
