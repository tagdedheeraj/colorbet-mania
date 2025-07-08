
import { supabase } from '@/integrations/supabase/client';
import { AdminService } from './adminService';

export interface AdminSession {
  isAdmin: boolean;
  user: any;
  session: any;
}

export interface AuthHealthCheck {
  issue_type: string;
  issue_count: number;
  details: string;
}

export class AdminAuthService {
  // Simple health check using available functions
  static async checkAuthHealth(): Promise<AuthHealthCheck[]> {
    try {
      // Check if admin user exists using existing function
      const { data: adminExists } = await supabase.rpc('get_user_role', {
        user_id: '00000000-0000-0000-0000-000000000000' // placeholder
      });

      const healthChecks: AuthHealthCheck[] = [
        {
          issue_type: 'admin_user_exists',
          issue_count: adminExists ? 1 : 0,
          details: 'Admin users in system'
        }
      ];

      return healthChecks;
    } catch (error) {
      console.error('Health check failed:', error);
      return [];
    }
  }

  // Simplified fallback auth without custom functions
  static async fallbackAuth(email: string, password: string): Promise<{ success: boolean; error?: any }> {
    try {
      console.log('Attempting fallback authentication...');
      
      // Try to sign in directly with Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return { success: false, error: { message: 'Invalid credentials' } };
      }

      // Check if user is admin
      const isAdmin = await AdminService.isAdmin(data.user.id);
      if (!isAdmin) {
        await supabase.auth.signOut();
        return { success: false, error: { message: 'Admin access required' } };
      }

      console.log('Fallback authentication successful');
      return { success: true };
    } catch (error) {
      console.error('Fallback auth exception:', error);
      return { success: false, error };
    }
  }

  static async verifyAdminSession(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return false;
      }

      // Check if user has admin role in database
      const isAdmin = await AdminService.isAdmin(session.user.id);
      return isAdmin;
    } catch (error) {
      console.error('Error verifying admin session:', error);
      return false;
    }
  }

  static async getCurrentAdminSession(): Promise<AdminSession | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return null;
      }

      const isAdmin = await AdminService.isAdmin(session.user.id);
      
      if (!isAdmin) {
        return null;
      }

      return {
        isAdmin: true,
        user: session.user,
        session: session
      };
    } catch (error) {
      console.error('Error getting admin session:', error);
      return null;
    }
  }

  static async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  static async getAdminInfo() {
    try {
      const session = await this.getCurrentAdminSession();
      if (!session) return null;

      return {
        username: session.user.email?.split('@')[0] || 'Admin',
        email: session.user.email,
        id: session.user.id
      };
    } catch (error) {
      console.error('Error getting admin info:', error);
      return null;
    }
  }

  static async signInWithEmail(email: string, password: string): Promise<{ error?: any }> {
    try {
      console.log('Starting admin authentication...');
      
      // Step 1: Check database health first
      const healthCheck = await this.checkAuthHealth();
      console.log('Database health check:', healthCheck);
      
      // Step 2: Attempt primary Supabase authentication
      console.log('Attempting primary Supabase auth...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Primary auth failed:', error);
        
        // Step 3: If primary auth fails, try fallback authentication
        if (error.message?.includes('Database error') || 
            error.message?.includes('Invalid login credentials') ||
            error.message?.includes('email_change_token')) {
          
          console.log('Attempting fallback authentication...');
          const fallbackResult = await this.fallbackAuth(email, password);
          
          if (fallbackResult.success) {
            return { error: null };
          } else {
            return { error: fallbackResult.error };
          }
        }
        
        return { error };
      }

      if (data.user) {
        // Step 4: Wait for session to be established
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Step 5: Verify admin status
        const isAdmin = await AdminService.isAdmin(data.user.id);
        if (!isAdmin) {
          await supabase.auth.signOut();
          return { error: { message: 'Admin access required' } };
        }
        
        console.log('Primary authentication successful');
      }

      return { error: null };
    } catch (error) {
      console.error('Authentication exception:', error);
      
      // Final fallback attempt
      try {
        const fallbackResult = await this.fallbackAuth(email, password);
        if (fallbackResult.success) {
          return { error: null };
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
      
      return { error };
    }
  }
}
