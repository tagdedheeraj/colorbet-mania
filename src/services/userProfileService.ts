
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';

export const UserProfileService = {
  async fetchUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError || !profileData) {
        console.log('No profile found:', profileError);
        return null;
      }
      
      console.log('Profile fetched successfully for user:', userId);
      
      return {
        id: profileData.id,
        email: profileData.email || '',
        username: profileData.email?.split('@')[0] || 'user', // Generate username from email
        balance: profileData.balance || 0,
        referral_code: null, // Not available in current schema
        referred_by: null, // Not available in current schema
        created_at: profileData.created_at || new Date().toISOString(),
        updated_at: profileData.updated_at || new Date().toISOString()
      };
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  },

  async updateProfile(userId: string, data: { full_name?: string; phone?: string }): Promise<void> {
    // Since full_name and phone don't exist in the current schema, we'll just log and return
    console.log('Profile update requested but fields not available in schema:', data);
    // For now, we'll just update the email if needed
    // In a real implementation, you might want to add these fields to the profiles table
  },

  async updateBalance(userId: string, newBalance: number): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (error) throw error;
  }
};
