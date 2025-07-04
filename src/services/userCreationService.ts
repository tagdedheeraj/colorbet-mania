
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

      // Create profile with initial balance
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          balance: 1000.00
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      // Add signup bonus transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'signup_bonus',
          amount: 1000.00,
          balance_before: 0,
          balance_after: 1000.00,
          description: 'Welcome bonus'
        });

      if (transactionError && !transactionError.message.includes('duplicate key')) {
        console.error('Transaction creation error (non-critical):', transactionError);
      }

      console.log('Successfully created user data');
    } catch (error) {
      console.error('Error creating user data:', error);
      throw error;
    }
  }
};
