
import useUserStore from './userStore';
import useTransactionStore from './transactionStore';
import useReferralStore from './referralStore';

// Re-export all the store hooks and functions for backward compatibility
const useAuthStore = () => {
  const userStore = useUserStore();
  const transactionStore = useTransactionStore();
  const referralStore = useReferralStore();
  
  return {
    // User management
    user: userStore.user,
    isAuthenticated: userStore.isAuthenticated,
    isAuthModalOpen: userStore.isAuthModalOpen,
    login: userStore.login,
    register: userStore.register,
    logout: userStore.logout,
    setAuthModalOpen: userStore.setAuthModalOpen,
    updateBalance: userStore.updateBalance,
    updateProfile: userStore.updateProfile,
    changePassword: userStore.changePassword,
    
    // Transaction management
    addTransaction: transactionStore.addTransaction,
    getTransactions: transactionStore.getTransactions,
    
    // Referral management
    getReferralCode: referralStore.getReferralCode,
    applyReferralCode: referralStore.applyReferralCode
  };
};

export default useAuthStore;
