
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { useGameState } from '@/store/gameState';
import { useGameOperations } from '@/store/gameOperations';
import { useGameTimer } from '@/store/gameTimer';
import { useBettingOperations } from '@/store/bettingOperations';
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
  const { isLoading: gameLoading, loadUserBalance } = useGameState();
  
  // Get operations hooks
  const gameOps = useGameOperations();
  const timer = useGameTimer();
  const bettingOps = useBettingOperations();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isInitialized, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const initializeGame = async () => {
        console.log('Starting game initialization for user:', user.id);
        
        // Initialize game operations
        await gameOps.initialize();
        
        // Load user balance
        await loadUserBalance();
        
        // Start the timer for the current game
        timer.startGameTimer();
        
        console.log('Game initialization completed');
      };
      
      initializeGame();
    }
  }, [isAuthenticated, user]);

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
