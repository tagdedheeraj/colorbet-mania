
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const UserCreationService = {
  async createMissingUserData(user: User): Promise<void> {
    try {
      console.log('Creating missing user data for:', user.id);
      
      // Check if user already exists first
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (existingUser) {
        console.log('User already exists, skipping creation');
        return;
      }

      // Generate unique username
      let username = user.user_metadata?.username || user.email?.split('@')[0] || 'user';
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const finalUsername = attempts === 0 ? username : `${username}${Math.floor(Math.random() * 1000)}`;
          
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email!,
              username: finalUsername,
              balance: 1000.00,
              referral_code: 'REF' + Math.floor(Math.random() * 999999).toString().padStart(6, '0')
            });

          if (userError) {
            if (userError.message.includes('duplicate key') && userError.message.includes('username')) {
              attempts++;
              continue;
            }
            throw userError;
          }
          break;
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw error;
          }
        }
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ user_id: user.id });

      if (profileError && !profileError.message.includes('duplicate key')) {
        console.error('Profile creation error (non-critical):', profileError);
      }

      // Add signup bonus
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'signup_bonus',
          amount: 1000.00,
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
