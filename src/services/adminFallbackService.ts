
import { supabase } from '@/integrations/supabase/client';

export class AdminFallbackService {
  static async verifyPassword(storedHash: string, inputPassword: string): Promise<boolean> {
    try {
      // Create a temporary function to verify password since we can't access crypt directly
      const { data, error } = await supabase.rpc('verify_password_hash', {
        stored_hash: storedHash,
        input_password: inputPassword
      });

      if (error) {
        console.error('Password verification error:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }

  static async createEmergencyAdminSession(email: string): Promise<any> {
    // For emergency cases, create a temporary session-like object
    return {
      user: {
        id: 'emergency-admin',
        email: email,
        role: 'admin'
      },
      session: {
        access_token: 'emergency-token',
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }
    };
  }
}
