
import { create } from 'zustand';
import { User } from '../types/game';
import { toast } from "sonner";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setAuthModalOpen: (isOpen: boolean) => void;
  updateBalance: (amount: number) => void;
}

// Mock storage for demo purposes
const USERS_STORAGE_KEY = 'color-prediction-users';

// Helper function to get users from local storage
const getStoredUsers = (): Record<string, { username: string; password: string; balance: number }> => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
};

// Helper function to save users to local storage
const saveUsers = (users: Record<string, { username: string; password: string; balance: number }>) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

// Helper function to get current user from local storage
const getCurrentUser = (): User | null => {
  const storedUser = localStorage.getItem('current-user');
  return storedUser ? JSON.parse(storedUser) : null;
};

// Helper function to save current user to local storage
const saveCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem('current-user', JSON.stringify(user));
  } else {
    localStorage.removeItem('current-user');
  }
};

const useAuthStore = create<AuthState>((set, get) => ({
  user: getCurrentUser(),
  isAuthenticated: !!getCurrentUser(),
  isAuthModalOpen: false,

  login: async (username: string, password: string) => {
    const users = getStoredUsers();
    const user = users[username];

    if (!user || user.password !== password) {
      toast.error("Invalid username or password");
      throw new Error('Invalid username or password');
    }

    const loggedInUser: User = {
      id: username,
      username: username,
      balance: user.balance,
      isLoggedIn: true
    };

    set({ user: loggedInUser, isAuthenticated: true, isAuthModalOpen: false });
    saveCurrentUser(loggedInUser);
    toast.success(`Welcome back, ${username}!`);
  },

  register: async (username: string, password: string) => {
    const users = getStoredUsers();

    if (users[username]) {
      toast.error("Username already exists");
      throw new Error('Username already exists');
    }

    // Add new user
    users[username] = {
      username,
      password,
      balance: 1000 // Starting balance
    };
    saveUsers(users);

    // Auto-login after registration
    const newUser: User = {
      id: username,
      username,
      balance: 1000,
      isLoggedIn: true
    };

    set({ user: newUser, isAuthenticated: true, isAuthModalOpen: false });
    saveCurrentUser(newUser);
    toast.success("Account created successfully!");
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
    saveCurrentUser(null);
    toast.info("Logged out successfully");
  },

  setAuthModalOpen: (isOpen: boolean) => {
    set({ isAuthModalOpen: isOpen });
  },

  updateBalance: (amount: number) => {
    const { user } = get();
    if (user) {
      const updatedUser = {
        ...user,
        balance: user.balance + amount
      };
      
      // Update user in store
      set({ user: updatedUser });
      
      // Update in localStorage
      saveCurrentUser(updatedUser);
      
      // Update user in users storage
      const users = getStoredUsers();
      if (users[user.id]) {
        users[user.id].balance = updatedUser.balance;
        saveUsers(users);
      }
    }
  }
}));

export default useAuthStore;
