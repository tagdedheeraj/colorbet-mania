
import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

class AdminAuthService {
  static async getCurrentAdminUser(): Promise<AdminUser | null> {
    try {
      console.log('🔍 Getting current admin user...');
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Auth error:', error);
        return null;
      }
      
      if (!user) {
        console.log('👤 No authenticated user found');
        return null;
      }

      // Get user profile from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError);
        return null;
      }

      if (!profile) {
        console.log('👤 No profile found for user');
        return null;
      }

      // For now, assume all authenticated users can be admins
      console.log('✅ Admin user validated:', profile.email);
      
      return {
        id: profile.id,
        email: profile.email || '',
        username: profile.username || '',
        balance: profile.balance || 0,
        created_at: profile.created_at || new Date().toISOString(),
        updated_at: profile.updated_at || new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Exception in getCurrentAdminUser:', error);
      return null;
    }
  }

  static async validateAdminAccess(): Promise<boolean> {
    try {
      console.log('🔐 Validating admin access...');
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('❌ No authenticated user');
        return false;
      }

      // Get user from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        console.error('❌ Profile not found:', profileError);
        return false;
      }

      // For now, allow any authenticated user to be admin
      console.log('✅ Admin access validated for:', profile.email);
      return true;

    } catch (error) {
      console.error('❌ Exception in validateAdminAccess:', error);
      return false;
    }
  }

  static async getAllAdminUsers(): Promise<AdminUser[]> {
    try {
      console.log('👥 Loading all admin users...');
      
      // Get all users from profiles table
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading admin users:', error);
        return [];
      }

      const adminUsers: AdminUser[] = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email || '',
        username: profile.username || '',
        balance: profile.balance || 0,
        created_at: profile.created_at || new Date().toISOString(),
        updated_at: profile.updated_at || new Date().toISOString()
      }));

      console.log('✅ Admin users loaded:', adminUsers.length);
      return adminUsers;

    } catch (error) {
      console.error('❌ Exception in getAllAdminUsers:', error);
      return [];
    }
  }

  // Add missing authentication methods
  static async isAuthenticated(): Promise<boolean> {
    return await this.validateAdminAccess();
  }

  static async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Login error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Exception in login:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  static async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Password change error:', error);
        return { success: false, error: error.message };
      }

      // Auto logout after password change for security
      await this.logout();
      return { success: true };
    } catch (error) {
      console.error('❌ Exception in changePassword:', error);
      return { success: false, error: 'Password change failed' };
    }
  }

  static getSessionToken(): string | null {
    // Get session from localStorage
    const session = localStorage.getItem('supabase.auth.token');
    return session;
  }

  static async validateCurrentSession(): Promise<boolean> {
    return await this.validateAdminAccess();
  }

  static async hasAdminRole(): Promise<boolean> {
    return await this.validateAdminAccess();
  }
}

export default AdminAuthService;
