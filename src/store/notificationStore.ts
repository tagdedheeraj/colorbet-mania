
import { create } from 'zustand';
import { toast } from "sonner";

export interface Notification {
  id: string;
  type: 'deposit' | 'withdrawal' | 'signup' | 'referral' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  timestamp: number;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

// Helper to get notifications from local storage
const getStoredNotifications = (): Notification[] => {
  const stored = localStorage.getItem('color-prediction-notifications');
  return stored ? JSON.parse(stored) : [];
};

// Helper to save notifications to local storage
const saveNotifications = (notifications: Notification[]) => {
  localStorage.setItem('color-prediction-notifications', JSON.stringify(notifications));
};

const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: getStoredNotifications(),
  unreadCount: getStoredNotifications().filter(n => !n.isRead).length,
  
  addNotification: (notification) => {
    const newNotification: Notification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      isRead: false,
      timestamp: Date.now(),
      ...notification
    };
    
    const notifications = [newNotification, ...get().notifications];
    set({ 
      notifications, 
      unreadCount: notifications.filter(n => !n.isRead).length 
    });
    saveNotifications(notifications);
    
    // Show toast notification
    toast(notification.title, {
      description: notification.message,
      position: "top-center",
    });
  },
  
  markAsRead: (id) => {
    const notifications = get().notifications.map(notification => 
      notification.id === id 
        ? { ...notification, isRead: true } 
        : notification
    );
    
    set({ 
      notifications, 
      unreadCount: notifications.filter(n => !n.isRead).length 
    });
    saveNotifications(notifications);
  },
  
  markAllAsRead: () => {
    const notifications = get().notifications.map(notification => ({ 
      ...notification, 
      isRead: true 
    }));
    
    set({ notifications, unreadCount: 0 });
    saveNotifications(notifications);
  },
  
  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
    saveNotifications([]);
  },
}));

export default useNotificationStore;
