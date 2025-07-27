
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const UserCreationService = {
  async createMissingUserData(user: User): Promise<void> {
    try {
      console.log('Creating missing user data for:', user.id);
      
      // Check if user profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (existingProfile) {
        console.log('User profile already exists, skipping creation');
        return;
      }

      // Create profile with no initial balance
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          balance: 0.00  // No signup bonus
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      // No signup bonus transaction

      console.log('Successfully created user data without signup bonus');
    } catch (error) {
      console.error('Error creating user data:', error);
      throw error;
    }
  }
};
