
import React, { useEffect, useState } from 'react';
import { User, Wallet, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { useGameState } from '@/store/gameState';
import { supabase } from '@/integrations/supabase/client';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut, profile } = useSupabaseAuthStore();
  const { userBalance, loadUserBalance } = useGameState();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadBalance();
      loadUserBalance();
      
      // Set up real-time balance updates
      const channel = supabase
        .channel('balance-updates')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        }, (payload) => {
          console.log('Balance updated:', payload.new.balance);
          setBalance(payload.new.balance || 0);
          loadUserBalance(); // Update game state balance too
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated, user, loadUserBalance]);

  const loadBalance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading balance:', error);
        return;
      }

      setBalance(data?.balance || 0);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isAuthenticated) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">TW</span>
              </div>
              <span className="font-bold text-lg">Trade For Win</span>
            </div>
          </div>
          <Button onClick={() => navigate('/auth')} variant="default">
            Login
          </Button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">TW</span>
            </div>
            <span className="font-bold text-lg">Trade For Win</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Balance Display */}
          <div className="hidden sm:flex items-center space-x-2 bg-muted px-3 py-1 rounded-full">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">₹{balance.toFixed(2)}</span>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {getInitials(profile?.full_name || user?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{profile?.full_name || user?.email}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              
              {/* Balance for mobile */}
              <div className="sm:hidden px-2 py-1">
                <div className="flex items-center space-x-2 text-sm">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Balance: ₹{balance.toFixed(2)}</span>
                </div>
              </div>
              <DropdownMenuSeparator className="sm:hidden" />
              
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/wallet')}>
                <Wallet className="mr-2 h-4 w-4" />
                <span>Wallet</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
