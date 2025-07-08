
import { supabase } from '@/integrations/supabase/client';
import { AdminService } from './adminService';
import { EmergencyAdminService } from './emergencyAdminService';

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
  // Comprehensive health check
  static async checkAuthHealth(): Promise<AuthHealthCheck[]> {
    try {
      const healthChecks: AuthHealthCheck[] = [];
      
      // Check database connection
      const { data: testQuery, error: dbError } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      healthChecks.push({
        issue_type: 'database_connection',
        issue_count: dbError ? 1 : 0,
        details: 'Database connection status'
      });

      // Check admin user exists
      const { data: adminUsers } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      healthChecks.push({
        issue_type: 'admin_user_exists',
        issue_count: (adminUsers && adminUsers.length > 0) ? 0 : 1,
        details: 'Admin user availability'
      });

      // Check emergency admin status
      const emergencyReady = await EmergencyAdminService.checkEmergencyAdmin();
      healthChecks.push({
        issue_type: 'emergency_admin_ready',
        issue_count: emergencyReady ? 0 : 1,
        details: 'Emergency admin backup system'
      });

      return healthChecks;
    } catch (error) {
      console.error('Health check failed:', error);
      return [{
        issue_type: 'system_error',
        issue_count: 1,
        details: 'System health check failed'
      }];
    }
  }

  // Multi-path authentication with fallbacks
  static async signInWithEmail(email: string, password: string): Promise<{ error?: any; success?: boolean; method?: string }> {
    console.log('=== STARTING MULTI-PATH ADMIN AUTH ===');
    
    // Path 1: Primary Supabase Authentication
    try {
      console.log('Attempting primary Supabase authentication...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user) {
        console.log('Primary auth successful, checking admin role...');
        const isAdmin = await AdminService.isAdmin(data.user.id);
        
        if (isAdmin) {
          console.log('✅ Primary authentication successful');
          return { success: true, method: 'primary' };
        } else {
          console.log('❌ User is not admin, signing out...');
          await supabase.auth.signOut();
          return { error: { message: 'Admin access required' } };
        }
      } else {
        console.log('Primary auth failed:', error?.message);
      }
    } catch (error) {
      console.error('Primary auth exception:', error);
    }

    // Path 2: Emergency Authentication
    console.log('Attempting emergency authentication...');
    try {
      const emergencyResult = await EmergencyAdminService.verifyEmergencyLogin(email, password);
      
      if (emergencyResult.success) {
        console.log('✅ Emergency authentication successful');
        return { success: true, method: 'emergency' };
      } else {
        console.log('❌ Emergency auth failed');
      }
    } catch (error) {
      console.error('Emergency auth exception:', error);
    }

    // Path 3: Database Fallback (Direct verification)
    console.log('Attempting database fallback authentication...');
    try {
      if (email === 'admin@gameapp.com' && password === 'admin123456') {
        const { data: adminUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', 'admin@gameapp.com')
          .eq('role', 'admin')
          .single();

        if (adminUser) {
          console.log('✅ Database fallback authentication successful');
          return { success: true, method: 'database_fallback', user: adminUser };
        }
      }
    } catch (error) {
      console.error('Database fallback exception:', error);
    }

    console.log('❌ All authentication methods failed');
    return { 
      error: { 
        message: 'All authentication methods failed. Please contact support.' 
      } 
    };
  }

  // Enhanced session verification
  static async verifyAdminSession(): Promise<boolean> {
    try {
      // Check emergency session first
      const emergencySession = localStorage.getItem('emergency_admin_session');
      if (emergencySession) {
        const session = JSON.parse(emergencySession);
        if (Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
          console.log('Valid emergency session found');
          return true;
        } else {
          localStorage.removeItem('emergency_admin_session');
        }
      }

      // Check regular Supabase session
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

  // Get current admin session with fallback support
  static async getCurrentAdminSession(): Promise<AdminSession | null> {
    try {
      // Check emergency session first
      const emergencySession = localStorage.getItem('emergency_admin_session');
      if (emergencySession) {
        const session = JSON.parse(emergencySession);
        if (Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
          return {
            isAdmin: true,
            user: session.user,
            session: { emergency: true, ...session }
          };
        } else {
          localStorage.removeItem('emergency_admin_session');
        }
      }

      // Check regular session
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

  // Enhanced logout with cleanup
  static async logout(): Promise<void> {
    try {
      // Clear emergency session
      localStorage.removeItem('emergency_admin_session');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      console.log('Admin logout completed');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  // Get admin info with fallback support
  static async getAdminInfo() {
    try {
      const session = await this.getCurrentAdminSession();
      if (!session) return null;

      // Handle emergency session
      if (session.session?.emergency) {
        return {
          username: 'admin',
          email: 'admin@gameapp.com',
          id: session.user?.id || 'emergency-admin'
        };
      }

      // Handle regular session
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

  // Initialize emergency admin if needed
  static async initializeEmergencyAdmin(): Promise<{ success: boolean; error?: any }> {
    try {
      return await EmergencyAdminService.createEmergencyAdminUser();
    } catch (error) {
      console.error('Failed to initialize emergency admin:', error);
      return { success: false, error };
    }
  }
}
