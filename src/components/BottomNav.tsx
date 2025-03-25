
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, UserRound, Wallet, Users, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const BottomNav = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  if (!isMobile) return null;
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around py-2">
        <Link 
          to="/" 
          className={cn(
            "flex flex-col items-center p-2 rounded-lg transition-colors",
            isActive("/") ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className="h-5 w-5 mb-1" />
          <span className="text-xs">Home</span>
        </Link>
        
        <Link 
          to="/wallet" 
          className={cn(
            "flex flex-col items-center p-2 rounded-lg transition-colors",
            isActive("/wallet") ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Wallet className="h-5 w-5 mb-1" />
          <span className="text-xs">Wallet</span>
        </Link>
        
        <Link 
          to="/referral" 
          className={cn(
            "flex flex-col items-center p-2 rounded-lg transition-colors",
            isActive("/referral") ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="h-5 w-5 mb-1" />
          <span className="text-xs">Refer</span>
        </Link>
        
        <Link 
          to="/about" 
          className={cn(
            "flex flex-col items-center p-2 rounded-lg transition-colors",
            isActive("/about") ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Info className="h-5 w-5 mb-1" />
          <span className="text-xs">About</span>
        </Link>
        
        <Link 
          to="/profile" 
          className={cn(
            "flex flex-col items-center p-2 rounded-lg transition-colors",
            isActive("/profile") ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <UserRound className="h-5 w-5 mb-1" />
          <span className="text-xs">Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNav;
