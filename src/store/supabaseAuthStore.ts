
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { AuthState, UserProfile } from '@/types/auth';
import { UserProfileService } from '@/services/userProfileService';
import { UserCreationService } from '@/services/userCreationService';

let authSubscription: (() => void) | null = null;
let isInitializing = false;

const useSupabaseAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  isInitialized: false,

  clearError: () => set({ error: null }),

  initialize: async () => {
    if (isInitializing) return;
    isInitializing = true;

    try {
      console.log('Starting auth initialization...');
      set({ isLoading: true, error: null });
      
      // Set initialization timeout - force complete after 5 seconds
      const initTimeout = setTimeout(() => {
        console.log('Auth initialization timeout - forcing completion');
        set({ 
          isLoading: false, 
          isInitialized: true,
          error: null
        });
        isInitializing = false;
      }, 5000);
      
      // Clean up existing subscription
      if (authSubscription) {
        authSubscription();
        authSubscription = null;
      }
      
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'no user');
        
        // Clear timeout since we got response
        clearTimeout(initTimeout);
        
        // Update state synchronously
        set({ 
          user: session?.user || null, 
          session,
          isAuthenticated: !!session,
          error: null,
          isLoading: false,
          isInitialized: true
        });

        // Handle user session in background
        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(() => handleUserSession(session.user), 100);
        }
        
        isInitializing = false;
      });

      authSubscription = () => subscription.unsubscribe();

      // Get initial session with timeout
      try {
        const { data: { session }, error: sessionError } = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]) as any;
        
        clearTimeout(initTimeout);
        
        if (sessionError) {
          console.error('Session error:', sessionError);
        }
        
        set({ 
          user: session?.user || null, 
          session,
          isAuthenticated: !!session,
          isLoading: false,
          isInitialized: true,
          error: null
        });

        if (session?.user) {
          setTimeout(() => handleUserSession(session.user), 100);
        }
      } catch (error) {
        console.error('Session fetch failed:', error);
        clearTimeout(initTimeout);
        set({ 
          isLoading: false, 
          isInitialized: true, 
          error: null 
        });
      }

      isInitializing = false;
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ 
        isLoading: false, 
        error: null, 
        isInitialized: true 
      });
      isInitializing = false;
    }
  },

  createMissingUserData: async (user: User) => {
    try {
      await UserCreationService.createMissingUserData(user);
    } catch (error) {
      console.error('Error creating user data:', error);
    }
  },

  signOut: async () => {
    try {
      if (authSubscription) {
        authSubscription();
        authSubscription = null;
      }

      await supabase.auth.signOut({ scope: 'global' });
      
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
      const profile = await UserProfileService.fetchUserProfile(user.id);
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
      await UserProfileService.updateBalance(user.id, newBalance);
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
      await UserProfileService.updateProfile(user.id, data);
      const updatedProfile = await UserProfileService.fetchUserProfile(user.id);
      set({ profile: updatedProfile });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    }
  }
}));

// Helper function for handling user sessions
const handleUserSession = async (user: User) => {
  try {
    console.log('Loading profile for user:', user.id);
    let profile = await UserProfileService.fetchUserProfile(user.id);
    
    if (!profile) {
      console.log('No profile found, creating user data...');
      try {
        await useSupabaseAuthStore.getState().createMissingUserData(user);
        profile = await UserProfileService.fetchUserProfile(user.id);
      } catch (error) {
        console.error('Error creating user data:', error);
      }
    }
    
    useSupabaseAuthStore.setState({ 
      profile, 
      error: null 
    });
  } catch (error) {
    console.error('Profile handling error:', error);
    useSupabaseAuthStore.setState({ 
      error: null 
    });
  }
};

export default useSupabaseAuthStore;
