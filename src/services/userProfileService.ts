
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';

export const UserProfileService = {
  async fetchUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log('Fetching profile for user:', userId);
      
      // Get user data from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError || !userData) {
        console.log('No user found:', userError);
        return null;
      }
      
      console.log('Profile fetched successfully for user:', userId);
      
      return {
        id: userData.id,
        email: userData.email || '',
        username: userData.username || userData.email?.split('@')[0] || 'user',
        balance: userData.balance || 0,
        referral_code: userData.referral_code,
        referred_by: userData.referred_by,
        created_at: userData.created_at || new Date().toISOString(),
        updated_at: userData.updated_at || new Date().toISOString()
      };
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  },

  async updateProfile(userId: string, data: { full_name?: string; phone?: string }): Promise<void> {
    try {
      // Update profile in profiles table
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          full_name: data.full_name,
          phone: data.phone,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  async updateBalance(userId: string, newBalance: number): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (error) throw error;
  }
};
