
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import GameArea from '@/components/GameArea';
import BettingPanel from '@/components/BettingPanel';
import ResultPopup from '@/components/ResultPopup';
import GameHistory from '@/components/GameHistory';
import GameModeSelector from '@/components/GameModeSelector';
import useSupabaseGameStore from '@/store/supabaseGameStore';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';

const Index = () => {
  const { initialize, isLoading } = useSupabaseGameStore();
  const { isAuthenticated } = useSupabaseAuthStore();

  useEffect(() => {
    // Set document title
    document.title = "Trade Hue";
    
    // Add mouse tracking for background effect
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      document.documentElement.style.setProperty('--mouse-x', x.toString());
      document.documentElement.style.setProperty('--mouse-y', y.toString());
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    // Initialize game store when authenticated
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        initialize();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [initialize, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#0F0F12] flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4 text-primary">Trade Hue</h1>
          <p className="text-gray-400 mb-6">Please log in to start playing</p>
          <button 
            onClick={() => window.location.href = '/auth'}
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#0F0F12] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading game data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0F0F12] bg-[radial-gradient(circle_at_var(--mouse-x,0.5)_var(--mouse-y,0.5),rgba(139,92,246,0.1)_0%,rgba(30,30,35,0)_50%)] transition-all duration-300">
      <div className="container-game relative z-10 py-4 px-2 sm:px-4 pb-20 lg:pb-4">
        <Header />
        
        <div className="pt-16 sm:pt-20">
          <GameModeSelector />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            <div className="lg:col-span-8 space-y-4 sm:space-y-6">
              <GameArea />
              <BettingPanel />
            </div>
            
            <div className="lg:col-span-4">
              <GameHistory />
            </div>
          </div>
        </div>
        
        <ResultPopup />
        
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full filter blur-[100px]"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/10 rounded-full filter blur-[100px]"></div>
        </div>
      </div>
    </div>
  );
};

export default Index;
