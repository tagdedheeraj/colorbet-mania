
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

      // Create profile with 50rs signup bonus
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          balance: 50.00  // 50rs signup bonus
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      // Create signup bonus transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'bonus',
          amount: 50.00,
          description: 'Welcome bonus - Thank you for joining!',
          status: 'completed'
        });

      if (transactionError) {
        console.error('Signup bonus transaction error:', transactionError);
        // Don't throw error here as profile is already created
      }

      console.log('Successfully created user data with 50rs signup bonus');
    } catch (error) {
      console.error('Error creating user data:', error);
      throw error;
    }
  }
};
