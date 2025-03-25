import { create } from 'zustand';
import { User, UserProfile, Transaction, TransactionType } from '../types/game';
import { toast } from "sonner";
import useNotificationStore from './notificationStore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setAuthModalOpen: (isOpen: boolean) => void;
  updateBalance: (amount: number) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  addTransaction: (type: TransactionType, amount: number, description?: string) => void;
  getTransactions: (type?: TransactionType) => Transaction[];
  getReferralCode: () => string;
  applyReferralCode: (code: string) => Promise<void>;
}

// Mock storage for demo purposes
const USERS_STORAGE_KEY = 'color-prediction-users';

// Helper function to get users from local storage
const getStoredUsers = (): Record<string, { username: string; password: string; balance: number; profile?: UserProfile; transactions?: Transaction[]; referralCode?: string; referredBy?: string }> => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
};

// Helper function to save users to local storage
const saveUsers = (users: Record<string, { username: string; password: string; balance: number; profile?: UserProfile; transactions?: Transaction[]; referralCode?: string; referredBy?: string }>) => {
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

// Helper function to generate a unique referral code
const generateReferralCode = (username: string): string => {
  return `${username.substring(0, 3).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
};

const useAuthStore = create<AuthState>((set, get) => ({
  user: getCurrentUser(),
  isAuthenticated: !!getCurrentUser(),
  isAuthModalOpen: false,

  login: async (username: string, password: string) => {
    const users = getStoredUsers();
    const user = users[username];
    const addNotification = useNotificationStore.getState().addNotification;

    if (!user || user.password !== password) {
      toast.error("Invalid username or password");
      throw new Error('Invalid username or password');
    }

    const loggedInUser: User = {
      id: username,
      username: username,
      balance: user.balance,
      isLoggedIn: true,
      profile: user.profile || {},
      transactions: user.transactions || []
    };

    set({ user: loggedInUser, isAuthenticated: true, isAuthModalOpen: false });
    saveCurrentUser(loggedInUser);
    toast.success(`Welcome back, ${username}!`);
    
    // Add login notification
    addNotification({
      type: 'system',
      title: 'Login Successful',
      message: `Welcome back, ${username}! You logged in successfully.`
    });
  },

  register: async (username: string, password: string) => {
    const users = getStoredUsers();
    const addNotification = useNotificationStore.getState().addNotification;

    if (users[username]) {
      toast.error("Username already exists");
      throw new Error('Username already exists');
    }

    const referralCode = generateReferralCode(username);
    
    // Add new user
    users[username] = {
      username,
      password,
      balance: 1050, // Starting balance with signup bonus
      profile: {
        referralCode
      },
      transactions: [{
        id: `signup-${Date.now()}`,
        type: 'signup_bonus',
        amount: 50,
        status: 'completed',
        timestamp: Date.now(),
        description: 'Signup bonus'
      }]
    };
    saveUsers(users);

    // Auto-login after registration
    const newUser: User = {
      id: username,
      username,
      balance: 1050,
      isLoggedIn: true,
      profile: { referralCode },
      transactions: [{
        id: `signup-${Date.now()}`,
        type: 'signup_bonus',
        amount: 50,
        status: 'completed',
        timestamp: Date.now(),
        description: 'Signup bonus'
      }]
    };

    set({ user: newUser, isAuthenticated: true, isAuthModalOpen: false });
    saveCurrentUser(newUser);
    toast.success("Account created successfully! You got 50 coins as a signup bonus.");
    
    // Add signup notification
    addNotification({
      type: 'signup',
      title: 'Welcome to Trade Hue!',
      message: 'Your account has been created successfully. You received 50 coins as a signup bonus!'
    });
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
  },

  updateProfile: (profileData: Partial<UserProfile>) => {
    const { user } = get();
    if (user) {
      const updatedProfile = {
        ...user.profile,
        ...profileData
      };
      
      const updatedUser = {
        ...user,
        profile: updatedProfile
      };
      
      // Update user in store
      set({ user: updatedUser });
      
      // Update in localStorage
      saveCurrentUser(updatedUser);
      
      // Update user in users storage
      const users = getStoredUsers();
      if (users[user.id]) {
        users[user.id].profile = updatedProfile;
        saveUsers(users);
      }
      
      toast.success("Profile updated successfully");
    }
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    const { user } = get();
    const addNotification = useNotificationStore.getState().addNotification;
    
    if (!user) {
      toast.error("You must be logged in to change your password");
      throw new Error("User not logged in");
    }
    
    const users = getStoredUsers();
    const userData = users[user.id];
    
    if (!userData || userData.password !== oldPassword) {
      toast.error("Current password is incorrect");
      throw new Error("Current password is incorrect");
    }
    
    // Update password
    users[user.id].password = newPassword;
    saveUsers(users);
    
    toast.success("Password changed successfully");
    
    // Add password change notification
    addNotification({
      type: 'system',
      title: 'Password Updated',
      message: 'Your password has been changed successfully.'
    });
  },

  addTransaction: (type: TransactionType, amount: number, description?: string) => {
    const { user } = get();
    const addNotification = useNotificationStore.getState().addNotification;
    
    if (user) {
      const newTransaction: Transaction = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type,
        amount,
        status: 'completed',
        timestamp: Date.now(),
        description
      };
      
      const userTransactions = user.transactions || [];
      const updatedTransactions = [newTransaction, ...userTransactions];
      
      const updatedUser = {
        ...user,
        transactions: updatedTransactions
      };
      
      // Update user in store
      set({ user: updatedUser });
      
      // Update in localStorage
      saveCurrentUser(updatedUser);
      
      // Update user in users storage
      const users = getStoredUsers();
      if (users[user.id]) {
        users[user.id].transactions = updatedTransactions;
        saveUsers(users);
      }
      
      // Add transaction notification
      let notificationTitle = '';
      let notificationMessage = '';
      
      switch (type) {
        case 'deposit':
          notificationTitle = 'Deposit Successful';
          notificationMessage = `${amount.toFixed(2)} coins have been added to your wallet.`;
          break;
        case 'withdrawal':
          notificationTitle = 'Withdrawal Successful';
          notificationMessage = `${amount.toFixed(2)} coins have been withdrawn from your wallet.`;
          break;
        case 'win':
          notificationTitle = 'Game Win';
          notificationMessage = `Congratulations! You won ${amount.toFixed(2)} coins.`;
          break;
        case 'bet':
          notificationTitle = 'Bet Placed';
          notificationMessage = `You placed a bet of ${amount.toFixed(2)} coins.`;
          break;
        case 'referral_bonus':
          notificationTitle = 'Referral Bonus';
          notificationMessage = `You received ${amount.toFixed(2)} coins as a referral bonus.`;
          break;
        case 'signup_bonus':
          notificationTitle = 'Signup Bonus';
          notificationMessage = `Welcome! You received ${amount.toFixed(2)} coins as a signup bonus.`;
          break;
      }
      
      if (notificationTitle) {
        addNotification({
          type: type === 'win' || type === 'bet' ? 'system' : type,
          title: notificationTitle,
          message: notificationMessage
        });
      }
      
      return newTransaction;
    }
  },

  getTransactions: (type?: TransactionType) => {
    const { user } = get();
    if (!user || !user.transactions) return [];
    
    if (type) {
      return user.transactions.filter(t => t.type === type);
    }
    
    return user.transactions;
  },

  getReferralCode: () => {
    const { user } = get();
    if (!user || !user.profile || !user.profile.referralCode) {
      // Generate one if it doesn't exist
      const referralCode = generateReferralCode(user?.username || 'user');
      get().updateProfile({ referralCode });
      return referralCode;
    }
    return user.profile.referralCode;
  },

  applyReferralCode: async (code: string) => {
    const { user } = get();
    const addNotification = useNotificationStore.getState().addNotification;
    
    if (!user) {
      toast.error("You must be logged in to apply a referral code");
      throw new Error("User not logged in");
    }
    
    if (user.profile?.referredBy) {
      toast.error("You have already applied a referral code");
      throw new Error("Referral code already applied");
    }
    
    // Check that the code is valid and not the user's own code
    if (user.profile?.referralCode === code) {
      toast.error("You cannot use your own referral code");
      throw new Error("Cannot use own referral code");
    }
    
    // Find the referring user
    const users = getStoredUsers();
    const referringUser = Object.values(users).find(u => u.profile?.referralCode === code);
    
    if (!referringUser) {
      toast.error("Invalid referral code");
      throw new Error("Invalid referral code");
    }
    
    // Update the current user
    get().updateProfile({ referredBy: referringUser.username });
    get().updateBalance(100);
    get().addTransaction('referral_bonus', 100, `Referral bonus from ${referringUser.username}`);
    
    // Update the referring user's balance
    if (users[referringUser.username]) {
      users[referringUser.username].balance += 100;
      
      // Add transaction
      const referrerTransactions = users[referringUser.username].transactions || [];
      referrerTransactions.unshift({
        id: `referral-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'referral_bonus',
        amount: 100,
        status: 'completed',
        timestamp: Date.now(),
        description: `Referral bonus for ${user.username}`
      });
      
      users[referringUser.username].transactions = referrerTransactions;
      saveUsers(users);
      
      // Add notification for the referring user (store it for when they login)
      const referrerNotifications = localStorage.getItem(`notifications-${referringUser.username}`);
      const notifications = referrerNotifications ? JSON.parse(referrerNotifications) : [];
      
      notifications.unshift({
        id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'referral',
        title: 'Referral Bonus',
        message: `${user.username} used your referral code. You received 100 coins!`,
        isRead: false,
        timestamp: Date.now()
      });
      
      localStorage.setItem(`notifications-${referringUser.username}`, JSON.stringify(notifications));
    }
    
    // Add notification for the current user
    addNotification({
      type: 'referral',
      title: 'Referral Bonus',
      message: `You used ${referringUser.username}'s referral code. You received 100 coins!`
    });
    
    toast.success("Referral code applied successfully! You received 100 coins.");
  }
}));

export default useAuthStore;
