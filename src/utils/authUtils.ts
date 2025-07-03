
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
    // Check if user exists in public.users table
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (userCheckError) {
      console.error('Error checking user existence:', userCheckError);
      return false;
    }

    if (!existingUser) {
      console.log('User not found in public.users, creating...');
      
      // Extract username from metadata or email
      const username = user.user_metadata?.username || user.email?.split('@')[0] || 'user';
      
      // Insert into users table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          username: username,
          balance: 1000.00,
          referral_code: 'REF' + Math.floor(Math.random() * 999999).toString().padStart(6, '0')
        });

      if (userError && !userError.message.includes('duplicate key')) {
        console.error('User creation error:', userError);
        throw userError;
      }

      // Insert into profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id
        });

      if (profileError && !profileError.message.includes('duplicate key')) {
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
          description: 'Welcome bonus'
        });

      if (transactionError) {
        console.error('Transaction creation error (non-critical):', transactionError);
      }

      console.log('Successfully created missing user data');
      return true;
    }

    return true;
  } catch (error) {
    console.error('Error ensuring user data exists:', error);
    return false;
  }
};
