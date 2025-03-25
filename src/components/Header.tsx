
import React from 'react';
import { Button } from "@/components/ui/button";
import useAuthStore from '@/store/authStore';
import useGameStore from '@/store/gameStore';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout, setAuthModalOpen } = useAuthStore();
  const { currentGameId, timeRemaining } = useGameStore();
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <header className="relative z-10">
      <div className="glass-panel px-4 py-3 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-full p-2">
            <div className="w-8 h-8 bg-primary rounded-full animate-pulse-subtle"></div>
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            Color Prediction
          </h1>
        </div>
        
        <div className="flex items-center justify-center gap-3 bg-secondary/50 px-4 py-2 rounded-full">
          <span className="text-sm font-medium text-muted-foreground">Game #</span>
          <span className="text-lg font-bold">{currentGameId}</span>
          <div className="h-4 w-px bg-border mx-1"></div>
          <span className="text-sm font-medium text-muted-foreground">Time</span>
          <span className={`text-lg font-bold ${timeRemaining <= 10 ? 'text-destructive animate-pulse' : ''}`}>
            {formatTime(timeRemaining)}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <div className="glass-panel py-1 px-3 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-game-green rounded-full"></div>
                <span className="text-sm font-medium">{user.username}</span>
              </div>
              <div className="glass-panel py-1 px-3 rounded-full flex items-center gap-2">
                <span className="text-game-gold font-bold">{user.balance.toFixed(2)}</span>
                <span className="text-xs opacity-70">coins</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-destructive/10 hover:bg-destructive/20 border-none" 
                onClick={logout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="glass-panel border-none"
                onClick={() => setAuthModalOpen(true)}
              >
                Login
              </Button>
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/80"
                onClick={() => setAuthModalOpen(true)}
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
