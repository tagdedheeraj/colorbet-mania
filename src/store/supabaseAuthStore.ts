
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { AuthState, UserProfile } from '@/types/auth';
import { UserProfileService } from '@/services/userProfileService';
import { UserSyncService } from '@/services/userSyncService';

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
      
      // Check if we're on admin routes and skip user auth initialization
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin')) {
        console.log('On admin route, skipping user auth initialization');
        set({ 
          isLoading: false, 
          isInitialized: true,
          error: null
        });
        isInitializing = false;
        return;
      }
      
      // Clean up existing subscription
      if (authSubscription) {
        authSubscription();
        authSubscription = null;
      }
      
      // Get initial session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        // Don't block initialization on session errors
      }
      
      // Set initial state
      set({ 
        user: session?.user || null, 
        session,
        isAuthenticated: !!session,
        isLoading: false,
        isInitialized: true,
        error: null
      });

      // Handle user session data loading
      if (session?.user) {
        setTimeout(() => handleUserSession(session.user), 100);
      }
      
      // Set up auth state listener after initial state
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'no user');
        
        // Update state synchronously
        set({ 
          user: session?.user || null, 
          session,
          isAuthenticated: !!session,
          error: null
        });

        // Handle user session in background
        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(() => handleUserSession(session.user), 100);
        }
      });

      authSubscription = () => subscription.unsubscribe();
      
      console.log('Auth initialization completed successfully');
      isInitializing = false;
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Always mark as initialized even on error to prevent infinite loading
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
      await UserSyncService.ensureUserExists(user);
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
    
    // Ensure user exists in public.users table
    const userExists = await UserSyncService.ensureUserExists(user);
    if (!userExists) {
      console.error('Failed to ensure user exists in database');
      useSupabaseAuthStore.setState({ 
        error: 'Failed to sync user data. Please try logging in again.' 
      });
      return;
    }
    
    let profile = await UserProfileService.fetchUserProfile(user.id);
    
    if (!profile) {
      console.log('No profile found, attempting to create user data...');
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
