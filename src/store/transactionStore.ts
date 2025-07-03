
import { create } from 'zustand';
import { Transaction, TransactionType } from '../types/game';
import { toast } from "sonner";
import useNotificationStore from './notificationStore';
import { getStoredUsers, saveUsers, getCurrentUser, saveCurrentUser } from './userStore';

interface TransactionState {
  addTransaction: (type: TransactionType, amount: number, description?: string) => void;
  getTransactions: (type?: TransactionType) => Transaction[];
}

const useTransactionStore = create<TransactionState>((set, get) => ({
  addTransaction: (type: TransactionType, amount: number, description?: string) => {
    const user = getCurrentUser();
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
          notificationMessage = `${Math.abs(amount).toFixed(2)} coins have been withdrawn from your wallet.`;
          break;
        case 'win':
          notificationTitle = 'Game Win';
          notificationMessage = `Congratulations! You won ${amount.toFixed(2)} coins.`;
          break;
        case 'bet':
          notificationTitle = 'Bet Placed';
          notificationMessage = `You placed a bet of ${Math.abs(amount).toFixed(2)} coins.`;
          break;
        case 'referral':
          notificationTitle = 'Referral Bonus';
          notificationMessage = `You received ${amount.toFixed(2)} coins as a referral bonus.`;
          break;
        case 'signup':
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
    const user = getCurrentUser();
    if (!user || !user.transactions) return [];
    
    if (type) {
      return user.transactions.filter(t => t.type === type);
    }
    
    return user.transactions;
  }
}));

export default useTransactionStore;
