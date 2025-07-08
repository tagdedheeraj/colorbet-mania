
import { supabase } from '@/integrations/supabase/client';

export class AdminUserCreationService {
  static async createAdminUser(email: string, password: string) {
    try {
      console.log('Creating admin user through Supabase Auth...');
      
      // Use Supabase's proper signup method
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`
        }
      });

      if (error) {
        console.error('Error creating admin user:', error);
        return { success: false, error };
      }

      if (!data.user) {
        return { success: false, error: { message: 'No user created' } };
      }

      console.log('Admin user created successfully:', data.user.id);

      // Update the user role to admin in public.users table
      const { error: roleError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', data.user.id);

      if (roleError) {
        console.error('Error setting admin role:', roleError);
        return { success: false, error: roleError };
      }

      console.log('Admin role set successfully');
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Exception creating admin user:', error);
      return { success: false, error };
    }
  }

  static async ensureAdminUserExists() {
    try {
      // Check if admin user already exists
      const { data: existingUsers, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'admin@gameapp.com')
        .eq('role', 'admin');

      if (error) {
        console.error('Error checking for existing admin:', error);
        return false;
      }

      if (existingUsers && existingUsers.length > 0) {
        console.log('Admin user already exists');
        return true;
      }

      // Create admin user if it doesn't exist
      console.log('Creating admin user...');
      const result = await this.createAdminUser('admin@gameapp.com', 'admin123456');
      
      if (result.success) {
        console.log('Admin user created successfully');
        return true;
      } else {
        console.error('Failed to create admin user:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Exception ensuring admin user exists:', error);
      return false;
    }
  }
}
