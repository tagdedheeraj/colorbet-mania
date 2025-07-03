
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
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateBalance: (amount: number) => Promise<void>;
  updateProfile: (data: { full_name?: string; phone?: string }) => Promise<void>;
}

const useSupabaseAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      console.log('Initializing auth store...');
      
      // Set up auth state listener first
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session) {
          const profile = await fetchUserProfile(session.user.id);
          set({ 
            user: session.user, 
            session, 
            profile,
            isAuthenticated: true,
            isLoading: false
          });
        } else {
          set({ 
            user: null, 
            session: null, 
            profile: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      });

      // Get initial session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        set({ isLoading: false });
        return;
      }
      
      if (session) {
        console.log('Found existing session:', session.user.email);
        const profile = await fetchUserProfile(session.user.id);
        set({ 
          user: session.user, 
          session, 
          profile,
          isAuthenticated: true,
          isLoading: false 
        });
      } else {
        console.log('No existing session found');
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false });
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
        isAuthenticated: false 
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
      const profile = await fetchUserProfile(user.id);
      set({ profile });
    } catch (error) {
      console.error('Profile refresh error:', error);
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

// Helper function to fetch user profile
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
      console.log('No user found for user:', userId);
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
