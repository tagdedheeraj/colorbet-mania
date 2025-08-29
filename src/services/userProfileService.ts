
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';

export const UserProfileService = {
  async fetchUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log('Fetching profile for user:', userId);
      
      // Get user data from profiles table
      const { data: userData, error: userError } = await supabase
        .from('profiles')
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
        referral_code: null, // Column doesn't exist in current schema
        referred_by: null, // Column doesn't exist in current schema
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
      // Since profiles table doesn't have full_name or phone columns,
      // we'll just update the updated_at timestamp for now
      const { error } = await supabase
        .from('profiles')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  async updateBalance(userId: string, newBalance: number): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (error) throw error;
  }
};
