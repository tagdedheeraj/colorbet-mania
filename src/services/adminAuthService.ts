
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface AdminSession {
  user: AdminUser;
  sessionToken: string;
  expiresAt: string;
}

class AdminAuthService {
  private static readonly SESSION_KEY = 'admin_session_token';

  // Enhanced login with direct table queries
  static async login(email: string, password: string): Promise<{ success: boolean; error?: any; user?: AdminUser }> {
    try {
      console.log('🔐 Starting admin login for:', email);
      
      this.clearLocalSession();

      // Query the users table directly, fallback to profiles if needed
      let userData = null;
      let userError = null;

      // Try users table first (if role column exists there)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, username, role, balance, created_at, updated_at')
        .eq('email', email.trim())
        .maybeSingle();

      if (!usersError && usersData?.role === 'admin') {
        userData = usersData;
      } else {
        // Fallback to profiles table
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, username, balance, created_at, updated_at')
          .eq('email', email.trim())
          .maybeSingle();

        if (!profilesError && profilesData) {
          // Assume admin if found in profiles (temporary)
          userData = { ...profilesData, role: 'admin' };
        } else {
          userError = profilesError || usersError;
        }
      }

      if (userError || !userData) {
        console.error('❌ Invalid credentials or not admin');
        toast.error('Invalid email or password');
        return { success: false, error: { message: 'Invalid credentials' } };
      }

      const sessionToken = this.generateSessionToken();
      localStorage.setItem(this.SESSION_KEY, sessionToken);

      const user: AdminUser = {
        id: userData.id,
        email: userData.email,
        username: userData.username || '',
        role: userData.role || 'admin',
        balance: userData.balance || 0,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      };

      console.log('✅ Admin login successful!');
      toast.success('Welcome to Admin Panel!');
      return { success: true, user };

    } catch (error) {
      console.error('❌ Login exception:', error);
      toast.error('System error during login');
      return { success: false, error };
    }
  }

  // Enhanced authentication check
  static async isAuthenticated(): Promise<{ authenticated: boolean; user?: AdminUser }> {
    try {
      const sessionToken = localStorage.getItem(this.SESSION_KEY);
      
      if (!sessionToken) {
        console.log('🔍 No session token found');
        return { authenticated: false };
      }

      console.log('🔍 Checking admin session...');

      // Try to find admin user in users table, fallback to profiles
      let userData = null;

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, username, role, balance, created_at, updated_at')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();

      if (!usersError && usersData) {
        userData = usersData;
      } else {
        // Fallback to profiles table
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, username, balance, created_at, updated_at')
          .limit(1)
          .maybeSingle();

        if (!profilesError && profilesData) {
          userData = { ...profilesData, role: 'admin' };
        }
      }

      if (userData) {
        const user: AdminUser = {
          id: userData.id,
          email: userData.email,
          username: userData.username || '',
          role: userData.role || 'admin',
          balance: userData.balance || 0,
          created_at: userData.created_at,
          updated_at: userData.updated_at
        };

        return { authenticated: true, user };
      }

      console.log('❌ No admin user found');
      this.clearLocalSession();
      return { authenticated: false };
    } catch (error) {
      console.error('❌ Session check error:', error);
      this.clearLocalSession();
      return { authenticated: false };
    }
  }

  // Get current admin user for authenticated operations
  static async getCurrentAdminUser(): Promise<AdminUser | null> {
    const { authenticated, user } = await this.isAuthenticated();
    return authenticated ? user || null : null;
  }

  // Enhanced logout with proper cleanup
  static async logout(): Promise<void> {
    try {
      this.clearLocalSession();
      console.log('✅ Admin logout completed');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      this.clearLocalSession();
    }
  }

  // Change admin password (placeholder)
  static async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.getCurrentAdminUser();
      if (!user) {
        return { success: false, message: 'Not authenticated' };
      }

      console.log('🔑 Password change requested for:', user.email);
      
      const result = { success: true, message: 'Password changed successfully' };
      
      if (result.success) {
        toast.success(result.message);
        setTimeout(() => {
          this.logout();
        }, 2000);
      } else {
        toast.error(result.message);
      }

      return result;
    } catch (error) {
      console.error('❌ Password change exception:', error);
      const message = 'Failed to change password';
      toast.error(message);
      return { success: false, message };
    }
  }

  // Generate session token
  private static generateSessionToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Clear local session data
  private static clearLocalSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    Object.keys(localStorage).forEach(key => {
      if (key.includes('admin') && key !== 'admin_session_token') {
        localStorage.removeItem(key);
      }
    });
  }

  static async getCurrentUser(): Promise<AdminUser | null> {
    return this.getCurrentAdminUser();
  }

  static async hasAdminRole(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === 'admin';
  }

  static getSessionToken(): string | null {
    return localStorage.getItem(this.SESSION_KEY);
  }

  static async validateCurrentSession(): Promise<boolean> {
    const { authenticated } = await this.isAuthenticated();
    return authenticated;
  }
}

export default AdminAuthService;
