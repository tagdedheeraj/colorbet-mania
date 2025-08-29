
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export class AdminUserCreationService {
  static async createUser(userData: {
    email: string;
    username: string;
    balance?: number;
  }): Promise<{ success: boolean; user?: any; error?: any }> {
    try {
      console.log('👤 Creating new user:', userData.email);

      // Create user in profiles table
      const { data: user, error } = await supabase
        .from('profiles')
        .insert({
          email: userData.email,
          username: userData.username,
          balance: userData.balance || 100
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating user:', error);
        toast.error('Failed to create user');
        return { success: false, error };
      }

      console.log('✅ User created successfully:', user.id);
      toast.success('User created successfully');
      return { success: true, user };

    } catch (error) {
      console.error('❌ Exception in createUser:', error);
      toast.error('Failed to create user');
      return { success: false, error };
    }
  }

  static async validateUserData(userData: {
    email: string;
    username: string;
    balance?: number;
  }): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!userData.email || !userData.email.includes('@')) {
      errors.push('Valid email is required');
    }

    if (!userData.username || userData.username.length < 3) {
      errors.push('Username must be at least 3 characters');
    }

    if (userData.balance !== undefined && userData.balance < 0) {
      errors.push('Balance cannot be negative');
    }

    return { valid: errors.length === 0, errors };
  }

  static async checkUserExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error checking user existence:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('❌ Exception checking user existence:', error);
      return false;
    }
  }
}
