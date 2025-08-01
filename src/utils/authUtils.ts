
import { supabase } from '@/integrations/supabase/client';

export const cleanupAuthState = () => {
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const ensureUserDataExists = async (user: any) => {
  try {
    // Check if user exists in profiles table
    const { data: existingUser, error: userCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (userCheckError) {
      console.error('Error checking user existence:', userCheckError);
      return false;
    }

    if (!existingUser) {
      console.log('User not found in profiles, creating...');
      
      // Extract username from metadata or email
      const username = user.user_metadata?.username || user.email?.split('@')[0] || 'user';
      
      // Insert into profiles table with 50rs signup bonus
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          balance: 50.00  // 50rs signup bonus
        });

      if (profileError && !profileError.message.includes('duplicate key')) {
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
        // Don't fail the process
      }

      console.log('Successfully created missing user data with 50rs signup bonus');
      return true;
    }

    return true;
  } catch (error) {
    console.error('Error ensuring user data exists:', error);
    return false;
  }
};
