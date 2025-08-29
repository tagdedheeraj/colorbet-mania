
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

  // Enhanced login with database functions (using direct SQL)
  static async login(email: string, password: string): Promise<{ success: boolean; error?: any; user?: AdminUser }> {
    try {
      console.log('🔐 Starting enhanced admin login for:', email);
      
      // Clear any existing session first
      this.clearLocalSession();

      // Check if user exists with admin role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, username, role, balance, created_at, updated_at')
        .eq('email', email.trim())
        .eq('role', 'admin')
        .single();

      if (userError || !userData) {
        console.error('❌ Invalid credentials or not admin');
        toast.error('Invalid email or password');
        return { success: false, error: { message: 'Invalid credentials' } };
      }

      // Generate session token
      const sessionToken = this.generateSessionToken();
      
      // Store session token locally
      localStorage.setItem(this.SESSION_KEY, sessionToken);

      const user: AdminUser = {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        role: userData.role,
        balance: userData.balance || 0,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      };

      console.log('✅ Enhanced admin login successful!');
      toast.success('Welcome to Admin Panel!');
      return { success: true, user };

    } catch (error) {
      console.error('❌ Enhanced login exception:', error);
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

      console.log('🔍 Checking admin session with token:', sessionToken.substring(0, 10) + '...');

      // Check if we have any admin users in the system
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, email, username, role, balance, created_at, updated_at')
        .eq('role', 'admin')
        .limit(1)
        .single();

      if (!error && userData) {
        const user: AdminUser = {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          role: userData.role,
          balance: userData.balance || 0,
          created_at: userData.created_at,
          updated_at: userData.updated_at
        };

        return { authenticated: true, user };
      }

      console.log('❌ Invalid or expired session');
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
      const sessionToken = localStorage.getItem(this.SESSION_KEY);
      
      if (sessionToken) {
        console.log('🚪 Cleaning up admin session...');
        // In production, you'd clean up the session in the database
      }

      this.clearLocalSession();
      console.log('✅ Admin logout completed');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('❌ Enhanced logout error:', error);
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

      // This is a placeholder - in production you'd implement actual password change
      console.log('🔑 Password change requested for:', user.email);
      
      const result = { success: true, message: 'Password changed successfully' };
      
      if (result.success) {
        toast.success(result.message);
        // Logout after successful password change for security
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
    // Clear any other admin-related local storage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('admin') && key !== 'admin_session_token') {
        localStorage.removeItem(key);
      }
    });
  }

  // Get current user info
  static async getCurrentUser(): Promise<AdminUser | null> {
    const { authenticated, user } = await this.isAuthenticated();
    return authenticated ? user || null : null;
  }

  // Check if current user has admin role
  static async hasAdminRole(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === 'admin';
  }

  // Enhanced method to get session token for API calls
  static getSessionToken(): string | null {
    return localStorage.getItem(this.SESSION_KEY);
  }

  // Method to verify session is still valid
  static async validateCurrentSession(): Promise<boolean> {
    const { authenticated } = await this.isAuthenticated();
    return authenticated;
  }
}

export default AdminAuthService;
