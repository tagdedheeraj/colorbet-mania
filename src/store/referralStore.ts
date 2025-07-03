
import { create } from 'zustand';
import { toast } from "sonner";
import useNotificationStore from './notificationStore';
import { getStoredUsers, saveUsers, getCurrentUser } from './userStore';

interface ReferralState {
  getReferralCode: () => string;
  applyReferralCode: (code: string) => Promise<void>;
}

// Helper function to generate a unique referral code
const generateReferralCode = (username: string): string => {
  return `${username.substring(0, 3).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
};

const useReferralStore = create<ReferralState>((set, get) => ({
  getReferralCode: () => {
    const user = getCurrentUser();
    if (!user || !user.profile || !user.profile.referralCode) {
      // Generate one if it doesn't exist
      const referralCode = generateReferralCode(user?.username || 'user');
      // We can't update profile directly here, so return the generated code
      // The calling component should handle updating the profile
      return referralCode;
    }
    return user.profile.referralCode;
  },

  applyReferralCode: async (code: string) => {
    const user = getCurrentUser();
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
    
    // Update the referring user's balance
    if (users[referringUser.username]) {
      users[referringUser.username].balance += 100;
      
      // Add transaction
      const referrerTransactions = users[referringUser.username].transactions || [];
      referrerTransactions.unshift({
        id: `referral-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'referral',
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

export default useReferralStore;
