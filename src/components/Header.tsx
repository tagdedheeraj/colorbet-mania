
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { AdminService } from '@/services/adminService';

const Header: React.FC = () => {
  const { user, profile, signOut, isAuthenticated } = useSupabaseAuthStore();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (user) {
      const adminStatus = await AdminService.isAdmin(user.id);
      setIsAdmin(adminStatus);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const formatBalance = (balance: number) => {
    return balance.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <header className="glass-panel sticky top-0 z-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Game Hub
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated && profile && (
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {formatBalance(profile.balance)} coins
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {profile.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm">
                        {profile.full_name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/wallet')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Wallet</span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {!isAuthenticated && (
            <Button onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
