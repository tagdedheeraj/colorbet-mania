
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, BadgeDollarSign, UserPlus, Wallet, ArrowDown, ArrowUp } from 'lucide-react';
import useNotificationStore from '@/store/notificationStore';
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'deposit':
      return <ArrowDown className="h-4 w-4 text-green-500" />;
    case 'withdrawal':
      return <ArrowUp className="h-4 w-4 text-orange-500" />;
    case 'signup':
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case 'referral':
      return <BadgeDollarSign className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4 text-primary" />;
  }
};

const NotificationCenter = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    clearNotifications();
    setIsOpen(false);
  };

  useEffect(() => {
    // Close popover when clicking outside on mobile
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile]);

  if (isMobile) {
    return (
      <div className="relative" ref={popoverRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2"
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-screen max-h-[80vh] bg-card shadow-lg rounded-lg border border-border z-50"
              style={{ width: 'calc(100vw - 20px)', right: -8 }}
            >
              <div className="p-3 flex items-center justify-between border-b border-border">
                <h3 className="font-medium">Notifications</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                    <Check className="h-4 w-4 mr-1" /> Mark all read
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClearAll}>
                    <X className="h-4 w-4 mr-1" /> Clear all
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[calc(80vh-60px)]">
                {notifications.length > 0 ? (
                  <div className="py-2">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-3 hover:bg-accent/50 cursor-pointer flex gap-3 ${
                          !notification.isRead ? 'bg-accent/20' : ''
                        }`}
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          <NotificationIcon type={notification.type} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>No notifications</p>
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 flex items-center justify-between border-b border-border">
          <h3 className="font-medium">Notifications</h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              <Check className="h-3 w-3 mr-1" /> Read all
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-[300px]">
          {notifications.length > 0 ? (
            <div className="py-2">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`px-3 py-2 hover:bg-accent/50 cursor-pointer flex gap-3 ${
                    !notification.isRead ? 'bg-accent/20' : ''
                  }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <NotificationIcon type={notification.type} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p>No notifications</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
