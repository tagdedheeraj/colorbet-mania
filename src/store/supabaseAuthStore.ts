
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  balance: number;
  referral_code: string | null;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
  full_name?: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateBalance: (amount: number) => Promise<void>;
  updateProfile: (data: { full_name?: string; phone?: string }) => Promise<void>;
  createMissingUserData: (user: User) => Promise<void>;
  clearError: () => void;
}

const useSupabaseAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  clearError: () => set({ error: null }),

  initialize: async () => {
    try {
      console.log('Initializing auth store...');
      set({ isLoading: true, error: null });
      
      // Set up auth state listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session) {
          set({ 
            user: session.user, 
            session,
            isAuthenticated: true,
            error: null
          });

          // Handle profile loading without setTimeout to avoid race conditions
          try {
            let profile = await fetchUserProfile(session.user.id);
            
            if (!profile) {
              console.log('No profile found, creating missing user data...');
              await get().createMissingUserData(session.user);
              // Retry fetching profile after creation
              profile = await fetchUserProfile(session.user.id);
            }
            
            set({ profile, isLoading: false, error: null });
          } catch (error) {
            console.error('Profile handling error:', error);
            set({ 
              isLoading: false, 
              error: 'Failed to load user profile. Please refresh the page.' 
            });
          }
        } else {
          set({ 
            user: null, 
            session: null, 
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      });

      // Get initial session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        set({ isLoading: false, error: 'Authentication error occurred' });
        return;
      }
      
      if (session) {
        console.log('Found existing session:', session.user.email);
        // The auth state change listener will handle the profile loading
      } else {
        console.log('No existing session found');
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false, error: 'Failed to initialize authentication' });
    }
  },

  createMissingUserData: async (user: User) => {
    try {
      console.log('Creating missing user data for:', user.id);
      
      // Generate a unique username by appending random numbers if needed
      let username = user.user_metadata?.username || user.email?.split('@')[0] || 'user';
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        try {
          // Try to insert the user
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email!,
              username: attempts === 0 ? username : `${username}${Math.floor(Math.random() * 1000)}`,
              balance: 1000.00,
              referral_code: 'REF' + Math.floor(Math.random() * 999999).toString().padStart(6, '0')
            });

          if (userError) {
            if (userError.message.includes('duplicate key') && userError.message.includes('username')) {
              attempts++;
              continue; // Try with a different username
            }
            if (userError.message.includes('duplicate key') && userError.message.includes('users_pkey')) {
              // User already exists, continue to profile creation
              break;
            }
            throw userError;
          }
          break; // Success, exit the loop
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw error;
          }
        }
      }

      // Insert into profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id
        });

      if (profileError && !profileError.message.includes('duplicate key')) {
        console.error('Profile creation error:', profileError);
        // Don't throw for profile errors as it's not critical
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

      if (transactionError && !transactionError.message.includes('duplicate key')) {
        console.error('Transaction creation error (non-critical):', transactionError);
        // Don't throw for transaction errors as it's not critical
      }

      console.log('Successfully created missing user data');
    } catch (error) {
      console.error('Error creating missing user data:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      // Clean up any existing auth data
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      set({ 
        user: null, 
        session: null, 
        profile: null,
        isAuthenticated: false,
        error: null
      });
      
      toast.success('Logged out successfully');
      
      // Force page reload for clean state
      setTimeout(() => {
        window.location.href = '/auth';
      }, 500);
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      set({ error: null });
      const profile = await fetchUserProfile(user.id);
      if (!profile) {
        await get().createMissingUserData(user);
        const newProfile = await fetchUserProfile(user.id);
        set({ profile: newProfile });
      } else {
        set({ profile });
      }
    } catch (error) {
      console.error('Profile refresh error:', error);
      set({ error: 'Failed to refresh profile' });
    }
  },

  updateBalance: async (amount: number) => {
    const { profile, user } = get();
    if (!profile || !user) return;

    try {
      const newBalance = profile.balance + amount;
      
      const { error } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', user.id);

      if (error) throw error;

      set({ 
        profile: { 
          ...profile, 
          balance: newBalance 
        }
      });
    } catch (error) {
      console.error('Balance update error:', error);
      toast.error('Failed to update balance');
    }
  },

  updateProfile: async (data: { full_name?: string; phone?: string }) => {
    const { user, profile } = get();
    if (!user || !profile) return;

    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Fetch updated profile
      const updatedProfile = await fetchUserProfile(user.id);
      set({ profile: updatedProfile });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    }
  }
}));

// Helper function to fetch user profile with better error handling
const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    console.log('Fetching profile for user:', userId);
    
    // Get user data from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      console.error('User fetch error:', userError);
      return null;
    }
    
    if (!userData) {
      console.log('No user found in users table for:', userId);
      return null;
    }

    // Get profile data from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }
    
    console.log('Profile fetched successfully:', userData.username);
    
    return {
      ...userData,
      full_name: profileData?.full_name || undefined,
      phone: profileData?.phone || undefined
    };
  } catch (error) {
    console.error('Profile fetch error:', error);
    return null;
  }
};

export default useSupabaseAuthStore;
