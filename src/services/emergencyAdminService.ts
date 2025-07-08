
import { supabase } from '@/integrations/supabase/client';

export class EmergencyAdminService {
  // Emergency admin authentication for when normal auth fails
  static async createEmergencyAdminUser(): Promise<{ success: boolean; error?: any }> {
    try {
      console.log('Creating emergency admin user...');
      
      // Check if admin user exists
      const { data: existingUsers } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'admin@gameapp.com')
        .eq('role', 'admin');

      if (existingUsers && existingUsers.length > 0) {
        console.log('Admin user already exists');
        return { success: true };
      }

      // Create admin user in users table directly
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: 'admin@gameapp.com',
          username: 'admin',
          role: 'admin',
          balance: 10000.00,
          referral_code: 'ADMIN001'
        })
        .select()
        .single();

      if (userError) {
        console.error('Error creating admin user:', userError);
        return { success: false, error: userError };
      }

      console.log('Emergency admin user created successfully');
      return { success: true };
    } catch (error) {
      console.error('Emergency admin creation failed:', error);
      return { success: false, error };
    }
  }

  // Check if emergency admin exists
  static async checkEmergencyAdmin(): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'admin@gameapp.com')
        .eq('role', 'admin')
        .single();

      return !!data;
    } catch (error) {
      console.error('Error checking emergency admin:', error);
      return false;
    }
  }

  // Emergency login verification
  static async verifyEmergencyLogin(email: string, password: string): Promise<{ success: boolean; user?: any }> {
    try {
      // Simple check for emergency admin credentials
      if (email === 'admin@gameapp.com' && password === 'admin123456') {
        const { data: adminUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', 'admin@gameapp.com')
          .eq('role', 'admin')
          .single();

        if (adminUser) {
          return { success: true, user: adminUser };
        }
      }

      return { success: false };
    } catch (error) {
      console.error('Emergency verification failed:', error);
      return { success: false };
    }
  }
}
