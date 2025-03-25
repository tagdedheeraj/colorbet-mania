
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, Plus, UserRound, LogOut, Settings, Coins } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import AuthModal from './AuthModal';
import useAuthStore from '@/store/authStore';
import NotificationCenter from './NotificationCenter';
import { toast } from "sonner";
import { useIsMobile } from '@/hooks/use-mobile';

const Header = () => {
  const [showBackground, setShowBackground] = useState(false);
  const { user, isAuthenticated, logout, setAuthModalOpen } = useAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setShowBackground(true);
      } else {
        setShowBackground(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial scroll position
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  const handleAuthModalOpen = () => {
    setIsAuthModalOpen(true);
    setAuthModalOpen(true);
  };
  
  const handleAuthModalClose = () => {
    setIsAuthModalOpen(false);
    setAuthModalOpen(false);
  };
  
  const handleLogout = () => {
    logout();
  };
  
  const handleAddFunds = () => {
    // For demo purposes, just add funds directly
    if (isAuthenticated) {
      // Show toast notification for demonstration purposes
      toast.success("Demo mode: 100 coins added to your account");
      
      // Simulate adding funds
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      toast.error("You need to login first");
      handleAuthModalOpen();
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${showBackground ? 'bg-background/80 backdrop-blur-md border-b border-border/40' : ''}`}>
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        <Link to="/" className="flex items-center">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
            Trade Hue
          </span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated && (
            <>
              <div className="flex items-center">
                <Coins className="h-4 w-4 mr-1 text-game-gold" />
                <span className="text-sm font-medium">{user?.balance.toFixed(2)}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="bg-primary/10 hover:bg-primary/20 text-primary"
                onClick={handleAddFunds}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </>
          )}
          
          {!isAuthModalOpen && !isAuthenticated && (
            <Dialog open={isAuthModalOpen} onOpenChange={handleAuthModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Login</Button>
              </DialogTrigger>
            </Dialog>
          )}
          
          {isAuthenticated && (
            <>
              <NotificationCenter />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 p-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://avatar.vercel.sh/${user?.username}`} />
                      <AvatarFallback>{user?.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {!isMobile && (
                      <>
                        <span className="text-sm font-medium max-w-[80px] truncate">{user?.username}</span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center cursor-pointer">
                      <UserRound className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/wallet" className="flex items-center cursor-pointer">
                      <Coins className="mr-2 h-4 w-4" />
                      <span>Wallet</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/referral" className="flex items-center cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Refer & Earn</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
      
      <AuthModal onClose={handleAuthModalClose} />
    </header>
  );
};

export default Header;
