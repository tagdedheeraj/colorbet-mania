
import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading your account...</h2>
          <p className="text-muted-foreground">Please wait a moment</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
