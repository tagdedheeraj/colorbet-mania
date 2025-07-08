
import { supabase } from '@/integrations/supabase/client';
import { AdminService } from './adminService';

export interface AdminSession {
  isAdmin: boolean;
  user: any;
  session: any;
}

export class AdminAuthService {
  static async verifyAdminSession(): Promise<boolean> {
    try {
      // First check localStorage for demo admin session
      const localAdminSession = localStorage.getItem('admin_session');
      if (localAdminSession) {
        const sessionData = JSON.parse(localAdminSession);
        const expiresAt = new Date(sessionData.expiresAt);
        
        if (expiresAt > new Date() && sessionData.isAdmin) {
          return true;
        }
      }

      // Then check Supabase authentication
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
      // First check localStorage for demo admin session
      const localAdminSession = localStorage.getItem('admin_session');
      if (localAdminSession) {
        const sessionData = JSON.parse(localAdminSession);
        const expiresAt = new Date(sessionData.expiresAt);
        
        if (expiresAt > new Date() && sessionData.isAdmin) {
          return {
            isAdmin: true,
            user: { email: 'admin@demo.com', id: 'demo-admin' },
            session: sessionData
          };
        }
      }

      // Then check Supabase authentication
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
      // Clear localStorage admin session
      localStorage.removeItem('admin_session');
      
      // Also try to sign out from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  static async getAdminInfo() {
    try {
      // Check localStorage first
      const localAdminSession = localStorage.getItem('admin_session');
      if (localAdminSession) {
        const sessionData = JSON.parse(localAdminSession);
        const expiresAt = new Date(sessionData.expiresAt);
        
        if (expiresAt > new Date() && sessionData.isAdmin) {
          return {
            username: sessionData.username,
            email: 'admin@demo.com',
            id: 'demo-admin'
          };
        }
      }

      // Then check Supabase session
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
