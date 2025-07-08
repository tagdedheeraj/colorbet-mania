
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
  // Simplified health check
  static async checkAuthHealth(): Promise<AuthHealthCheck[]> {
    try {
      // Check if we can connect to database
      const { data: testQuery } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      const healthChecks: AuthHealthCheck[] = [
        {
          issue_type: 'database_connection',
          issue_count: testQuery ? 0 : 1,
          details: 'Database connection status'
        }
      ];

      return healthChecks;
    } catch (error) {
      console.error('Health check failed:', error);
      return [{
        issue_type: 'database_error',
        issue_count: 1,
        details: 'Database health check failed'
      }];
    }
  }

  // Primary authentication method
  static async signInWithEmail(email: string, password: string): Promise<{ error?: any }> {
    try {
      console.log('Starting admin authentication...');
      
      // Try direct Supabase auth first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Primary auth failed:', error);
        return { error };
      }

      if (data.user) {
        // Check if user is admin
        const isAdmin = await AdminService.isAdmin(data.user.id);
        if (!isAdmin) {
          await supabase.auth.signOut();
          return { error: { message: 'Admin access required' } };
        }
        
        console.log('Authentication successful');
        return { error: null };
      }

      return { error: { message: 'Authentication failed' } };
    } catch (error) {
      console.error('Authentication exception:', error);
      return { error };
    }
  }

  static async verifyAdminSession(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return false;
      }

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
}
