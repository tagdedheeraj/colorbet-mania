
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';

export const UserProfileService = {
  async fetchUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError || !userData) {
        console.log('No user found:', userError);
        return null;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', userId)
        .maybeSingle();
      
      console.log('Profile fetched successfully for:', userData.username);
      
      return {
        ...userData,
        full_name: profileData?.full_name || undefined,
        phone: profileData?.phone || undefined
      };
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  },

  async updateProfile(userId: string, data: { full_name?: string; phone?: string }): Promise<void> {
    const { error: profileError } = await supabase
      .from('profiles')
      .update(data)
      .eq('user_id', userId);

    if (profileError) throw profileError;
  },

  async updateBalance(userId: string, newBalance: number): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (error) throw error;
  }
};
