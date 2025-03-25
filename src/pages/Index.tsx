
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import GameArea from '@/components/GameArea';
import BettingPanel from '@/components/BettingPanel';
import AuthModal from '@/components/AuthModal';
import ResultPopup from '@/components/ResultPopup';
import GameHistory from '@/components/GameHistory';

const Index = () => {
  // Add subtle background animation
  useEffect(() => {
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

  return (
    <div className="min-h-screen w-full bg-[#0F0F12] bg-[radial-gradient(circle_at_var(--mouse-x,0.5)_var(--mouse-y,0.5),rgba(139,92,246,0.1)_0%,rgba(30,30,35,0)_50%)] transition-all duration-300">
      <div className="container-game relative z-10">
        <Header />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <GameArea />
            <BettingPanel />
          </div>
          
          <div className="lg:col-span-4">
            <GameHistory />
          </div>
        </div>
        
        <AuthModal />
        <ResultPopup />
        
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full filter blur-[100px]"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-game-green/10 rounded-full filter blur-[100px]"></div>
        </div>
      </div>
    </div>
  );
};

export default Index;
