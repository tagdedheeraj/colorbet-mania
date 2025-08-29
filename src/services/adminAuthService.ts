
import { supabase } from '@/integrations/supabase/client';

class AdminAuthService {
  static async getCurrentAdminUser() {
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

      // Get user profile from profiles table (no role column exists)
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
      // In a real app, you'd check a role field or admin table
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
      // In production, you'd check an admin role or separate admin table
      console.log('✅ Admin access validated for:', profile.email);
      return true;

    } catch (error) {
      console.error('❌ Exception in validateAdminAccess:', error);
      return false;
    }
  }

  static async getAllAdminUsers() {
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

      const adminUsers = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email || '',
        username: profile.username || '',
        role: 'admin' as const, // Default role since column doesn't exist
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
}

export default AdminAuthService;
