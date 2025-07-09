
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: string;
}

export interface AdminSession {
  user: AdminUser;
  sessionToken: string;
  expiresAt: string;
}

class AdminAuthService {
  private static readonly SESSION_KEY = 'admin_session_token';

  // Login with email and password
  static async login(email: string, password: string): Promise<{ success: boolean; error?: any; user?: AdminUser }> {
    try {
      console.log('🔐 Starting admin login for:', email);
      
      // Clear any existing session first
      this.clearLocalSession();

      // Verify credentials using our database function
      const { data: credentialCheck, error: credentialError } = await supabase.rpc('verify_admin_credentials', {
        p_email: email.trim(),
        p_password: password.trim()
      });

      if (credentialError) {
        console.error('❌ Credential verification error:', credentialError);
        toast.error('Login failed - system error');
        return { success: false, error: credentialError };
      }

      if (!credentialCheck || credentialCheck.length === 0) {
        console.error('❌ Invalid credentials');
        toast.error('Invalid email or password');
        return { success: false, error: { message: 'Invalid credentials' } };
      }

      const userData = credentialCheck[0];
      console.log('✅ Credentials verified, creating session...');

      // Create admin session
      const { data: sessionToken, error: sessionError } = await supabase.rpc('create_admin_auth_session', {
        p_user_id: userData.user_id
      });

      if (sessionError || !sessionToken) {
        console.error('❌ Session creation error:', sessionError);
        toast.error('Failed to create session');
        return { success: false, error: sessionError };
      }

      // Store session token locally
      localStorage.setItem(this.SESSION_KEY, sessionToken);

      const user: AdminUser = {
        id: userData.user_id,
        email: userData.email,
        username: userData.username,
        role: userData.role
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

  // Check if user is logged in and verify session
  static async isAuthenticated(): Promise<{ authenticated: boolean; user?: AdminUser }> {
    try {
      const sessionToken = localStorage.getItem(this.SESSION_KEY);
      
      if (!sessionToken) {
        return { authenticated: false };
      }

      // Verify session with database
      const { data: sessionCheck, error } = await supabase.rpc('verify_admin_auth_session', {
        p_session_token: sessionToken
      });

      if (error || !sessionCheck || sessionCheck.length === 0) {
        console.log('❌ Invalid or expired session');
        this.clearLocalSession();
        return { authenticated: false };
      }

      const userData = sessionCheck[0];
      const user: AdminUser = {
        id: userData.user_id,
        email: userData.email,
        username: userData.username,
        role: userData.role
      };

      return { authenticated: true, user };
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
        // Clean up session in database
        await supabase
          .from('admin_auth_sessions')
          .delete()
          .eq('session_token', sessionToken);
      }

      this.clearLocalSession();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      this.clearLocalSession();
    }
  }

  // Clear local session data
  private static clearLocalSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    // Clear any other admin-related local storage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('admin') || key.startsWith('sb-') || key.includes('supabase')) {
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
}

export default AdminAuthService;
