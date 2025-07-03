
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import useSupabaseGameStore from '@/store/supabaseGameStore';
import Header from '@/components/Header';
import GameArea from '@/components/GameArea';
import BettingPanel from '@/components/BettingPanel';
import GameHistory from '@/components/GameHistory';
import ResultPopup from '@/components/ResultPopup';
import LoadingScreen from '@/components/LoadingScreen';
import BottomNav from '@/components/BottomNav';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized, user } = useSupabaseAuthStore();
  const { initialize: initializeGame, isLoading: gameLoading, loadUserGameResults } = useSupabaseGameStore();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isInitialized, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      initializeGame();
      if (user && loadUserGameResults) {
        loadUserGameResults(user.id);
      }
    }
  }, [isAuthenticated, initializeGame, user, loadUserGameResults]);

  if (!isInitialized || gameLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <GameArea />
            <BettingPanel />
          </div>
          
          <div className="space-y-6">
            <GameHistory />
          </div>
        </div>
      </main>

      <ResultPopup />
      <BottomNav />
    </div>
  );
};

export default Index;
