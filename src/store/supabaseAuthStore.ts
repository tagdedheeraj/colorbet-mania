
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { AuthState, UserProfile } from '@/types/auth';
import { UserProfileService } from '@/services/userProfileService';
import { UserCreationService } from '@/services/userCreationService';

// Store for auth subscription cleanup
let authSubscription: (() => void) | null = null;

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
      
      // Set a maximum timeout for initialization
      const initTimeout = setTimeout(() => {
        console.log('Auth initialization timeout - forcing completion');
        set({ 
          isLoading: false, 
          isInitialized: true,
          error: null
        });
      }, 10000); // 10 second timeout
      
      // Clean up existing subscription if any
      if (authSubscription) {
        authSubscription();
        authSubscription = null;
      }
      
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        // Clear the timeout since we got a response
        clearTimeout(initTimeout);
        
        // Only synchronous state updates in the callback
        set({ 
          user: session?.user || null, 
          session,
          isAuthenticated: !!session,
          error: null,
          isLoading: false,
          isInitialized: true
        });

        // Defer async operations to prevent deadlock
        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(() => {
            handleUserSession(session.user);
          }, 100);
        }
      });

      // Store cleanup function
      authSubscription = () => subscription.unsubscribe();

      // Get initial session with timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session fetch timeout')), 5000)
      );

      try {
        const { data: { session }, error: sessionError } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        clearTimeout(initTimeout);
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          set({ isLoading: false, error: null, isInitialized: true });
          return;
        }
        
        if (session?.user) {
          console.log('Found existing session for:', session.user.email);
          set({ 
            user: session.user, 
            session,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true
          });
          // Load profile in background
          setTimeout(() => handleUserSession(session.user), 100);
        } else {
          console.log('No existing session found');
          set({ isLoading: false, isInitialized: true });
        }
      } catch (error) {
        console.error('Session fetch failed:', error);
        clearTimeout(initTimeout);
        set({ isLoading: false, isInitialized: true, error: null });
      }

    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false, error: null, isInitialized: true });
    }
  },

  createMissingUserData: async (user: User) => {
    try {
      await UserCreationService.createMissingUserData(user);
    } catch (error) {
      console.error('Error creating user data:', error);
      // Don't throw error - continue with basic functionality
    }
  },

  signOut: async () => {
    try {
      // Clean up subscription
      if (authSubscription) {
        authSubscription();
        authSubscription = null;
      }

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
      const profile = await UserProfileService.fetchUserProfile(user.id);
      set({ profile });
    } catch (error) {
      console.error('Profile refresh error:', error);
      // Don't set error - continue with basic functionality
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

// Helper function moved outside the store
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
        // Continue without profile
      }
    }
    
    useSupabaseAuthStore.setState({ 
      profile, 
      error: null 
    });
  } catch (error) {
    console.error('Profile handling error:', error);
    // Don't set error state - just continue without profile
    useSupabaseAuthStore.setState({ 
      error: null 
    });
  }
};

export default useSupabaseAuthStore;
