
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

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session) {
          const profile = await fetchUserProfile(session.user.id);
          set({ 
            user: session.user, 
            session, 
            profile,
            isAuthenticated: true 
          });
        } else {
          set({ 
            user: null, 
            session: null, 
            profile: null,
            isAuthenticated: false 
          });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      set({ 
        user: null, 
        session: null, 
        profile: null,
        isAuthenticated: false 
      });
      toast.success('Logged out successfully');
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
  }
}));

// Helper function to fetch user profile
const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    console.log('Fetching profile for user:', userId);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
    
    if (!data) {
      console.log('No profile found for user:', userId);
      return null;
    }
    
    console.log('Profile fetched successfully:', data.username);
    return data;
  } catch (error) {
    console.error('Profile fetch error:', error);
    return null;
  }
};

export default useSupabaseAuthStore;
