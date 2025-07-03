
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
  isInitialized: boolean;
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
  isInitialized: false,

  clearError: () => set({ error: null }),

  initialize: async () => {
    try {
      console.log('Starting auth initialization...');
      set({ isLoading: true, error: null });
      
      // Set up auth state listener FIRST - NO ASYNC OPERATIONS HERE
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        // Only synchronous state updates in the callback
        set({ 
          user: session?.user || null, 
          session,
          isAuthenticated: !!session,
          error: null
        });

        // Defer async operations to prevent deadlock
        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(() => {
            get().handleUserSession(session.user);
          }, 0);
        } else if (!session) {
          set({ 
            profile: null,
            isLoading: false,
            isInitialized: true
          });
        }
      });

      // Get initial session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        set({ isLoading: false, error: 'Authentication error', isInitialized: true });
        return;
      }
      
      if (session?.user) {
        console.log('Found existing session for:', session.user.email);
        // The auth state change listener will handle the profile loading
      } else {
        console.log('No existing session found');
        set({ isLoading: false, isInitialized: true });
      }

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false, error: 'Failed to initialize authentication', isInitialized: true });
    }
  },

  handleUserSession: async (user: User) => {
    try {
      let profile = await fetchUserProfile(user.id);
      
      if (!profile) {
        console.log('No profile found, creating user data...');
        await get().createMissingUserData(user);
        profile = await fetchUserProfile(user.id);
      }
      
      set({ 
        profile, 
        isLoading: false,
        isInitialized: true,
        error: null 
      });
    } catch (error) {
      console.error('Profile handling error:', error);
      set({ 
        isLoading: false, 
        isInitialized: true,
        error: 'Failed to load user profile' 
      });
    }
  },

  createMissingUserData: async (user: User) => {
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
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      set({ 
        user: null, 
        session: null, 
        profile: null,
        isAuthenticated: false,
        error: null,
        isInitialized: true
      });
      
      toast.success('Logged out successfully');
      window.location.href = '/auth';
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
      set({ profile });
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
      const { error: profileError } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      const updatedProfile = await fetchUserProfile(user.id);
      set({ profile: updatedProfile });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    }
  }
}));

// Optimized helper function
const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
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
};

export default useSupabaseAuthStore;
