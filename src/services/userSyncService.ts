
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const UserSyncService = {
  async ensureUserExists(user: User): Promise<boolean> {
    try {
      console.log('Ensuring user exists in public.users:', user.id);
      
      // Check if user exists in public.users
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking user existence:', checkError);
        return false;
      }

      if (existingUser) {
        console.log('User already exists in public.users');
        return true;
      }

      console.log('User not found in public.users, creating...');
      
      // Extract username from metadata or email
      const username = user.user_metadata?.username || user.email?.split('@')[0] || 'user';
      
      // Create user entry in public.users with 50rs signup bonus
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          username: username,
          balance: 50.00  // 50rs signup bonus
        });

      if (insertError) {
        console.error('Error creating user in public.users:', insertError);
        return false;
      }

      // Create profile entry
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id
        });

      if (profileError && !profileError.message.includes('duplicate key')) {
        console.error('Error creating user profile:', profileError);
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
        // Don't fail the user creation process
      }

      console.log('Successfully created user data with 50rs signup bonus');
      return true;
    } catch (error) {
      console.error('Error in ensureUserExists:', error);
      return false;
    }
  },

  async validateUserForDeposit(userId: string): Promise<{ valid: boolean; message?: string }> {
    try {
      // Check if user exists in public.users
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, balance')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error validating user for deposit:', error);
        return { 
          valid: false, 
          message: 'Database error. Please try again.' 
        };
      }

      if (!user) {
        return { 
          valid: false, 
          message: 'User profile not found. Please log out and log in again.' 
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('Error in validateUserForDeposit:', error);
      return { 
        valid: false, 
        message: 'Validation error. Please try again.' 
      };
    }
  }
};
