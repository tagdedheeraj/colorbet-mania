
import { supabase } from '@/integrations/supabase/client';

export class EmergencyAdminService {
  // Enhanced emergency admin creation
  static async createEmergencyAdminUser(): Promise<{ success: boolean; error?: any }> {
    try {
      console.log('🚨 Creating emergency admin user...');
      
      // Check if admin user exists in public.users
      const { data: existingUsers } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'admin@gameapp.com')
        .eq('role', 'admin');

      if (existingUsers && existingUsers.length > 0) {
        console.log('✅ Admin user already exists in public.users');
        return { success: true };
      }

      // Create admin user in public.users table directly
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
        console.error('❌ Error creating admin user:', userError);
        return { success: false, error: userError };
      }

      console.log('✅ Emergency admin user created successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Emergency admin creation failed:', error);
      return { success: false, error };
    }
  }

  // Enhanced emergency admin check
  static async checkEmergencyAdmin(): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('users')
        .select('id, role')
        .eq('email', 'admin@gameapp.com')
        .eq('role', 'admin')
        .single();

      const exists = !!data;
      console.log(`Emergency admin status: ${exists ? '✅ Ready' : '❌ Not Ready'}`);
      return exists;
    } catch (error) {
      console.error('Error checking emergency admin:', error);
      return false;
    }
  }

  // Enhanced emergency login with better session management
  static async verifyEmergencyLogin(email: string, password: string): Promise<{ success: boolean; user?: any; session?: any }> {
    try {
      console.log('🚨 Attempting emergency login verification...');
      
      // Verify credentials
      if (email !== 'admin@gameapp.com' || password !== 'admin123456') {
        console.log('❌ Invalid emergency credentials');
        return { success: false };
      }

      // Get admin user from database
      const { data: adminUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'admin@gameapp.com')
        .eq('role', 'admin')
        .single();

      if (error || !adminUser) {
        console.log('❌ Emergency admin user not found in database');
        return { success: false };
      }

      // Create emergency session
      const emergencySession = {
        user: adminUser,
        timestamp: Date.now(),
        expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        type: 'emergency'
      };

      console.log('✅ Emergency login successful, creating session...');
      return { 
        success: true, 
        user: adminUser, 
        session: emergencySession 
      };
    } catch (error) {
      console.error('❌ Emergency verification failed:', error);
      return { success: false };
    }
  }

  // Create and store emergency session
  static createEmergencySession(user: any): void {
    try {
      const session = {
        user,
        timestamp: Date.now(),
        expires: Date.now() + (24 * 60 * 60 * 1000),
        type: 'emergency'
      };

      localStorage.setItem('emergency_admin_session', JSON.stringify(session));
      console.log('✅ Emergency session created and stored');
    } catch (error) {
      console.error('❌ Failed to create emergency session:', error);
    }
  }

  // Validate existing emergency session
  static validateEmergencySession(): boolean {
    try {
      const session = localStorage.getItem('emergency_admin_session');
      if (!session) return false;

      const parsedSession = JSON.parse(session);
      const now = Date.now();

      if (now > parsedSession.expires) {
        localStorage.removeItem('emergency_admin_session');
        console.log('🕐 Emergency session expired, removing...');
        return false;
      }

      console.log('✅ Emergency session is valid');
      return true;
    } catch (error) {
      console.error('❌ Error validating emergency session:', error);
      localStorage.removeItem('emergency_admin_session');
      return false;
    }
  }
}
