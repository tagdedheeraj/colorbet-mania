
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, Wallet, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNav: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    {
      name: 'Home',
      icon: Home,
      path: '/',
    },
    {
      name: 'Profile',
      icon: User,
      path: '/profile',
    },
    {
      name: 'Wallet',
      icon: Wallet,
      path: '/wallet',
    },
    {
      name: 'Refer',
      icon: Share2,
      path: '/referral',
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
      <div className="grid h-full grid-cols-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
