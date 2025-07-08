
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
}
