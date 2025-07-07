
import { GameInitializationService } from '@/services/gameInitializationService';
import { BetManagementService } from '@/services/betManagementService';
import { BetHistoryService } from '@/services/betHistoryService';
import { useGameState } from './gameState';

let isInitializing = false;

export const useGameOperations = () => {
  const {
    setCurrentGame,
    setGameHistory,
    setIsLoading,
    setCurrentBets,
    currentGameMode
  } = useGameState();

  const initialize = async () => {
    if (isInitializing) return;
    isInitializing = true;

    console.log('Initializing game operations...');
    setIsLoading(true);
    
    try {
      // Cleanup expired games first
      await GameInitializationService.cleanupExpiredGames();

      // Load or ensure active game
      const activeGame = await GameInitializationService.ensureActiveGame();
      
      // Load game history
      const { gameHistory } = await GameInitializationService.loadInitialData();
      
      // Format and set data
      const formattedActiveGame = activeGame ? {
        id: activeGame.id,
        game_number: activeGame.game_number, // Fixed: use game_number consistently
        result_color: activeGame.result_color,
        result_number: activeGame.result_number,
        start_time: activeGame.start_time,
        end_time: activeGame.end_time,
        status: activeGame.status || 'active',
        game_mode: 'quick',
        created_at: activeGame.created_at || new Date().toISOString()
      } : null;

      const formattedGameHistory = gameHistory.map((game: any) => ({
        id: game.id,
        game_number: game.game_number, // Fixed: use game_number consistently
        result_color: game.result_color,
        result_number: game.result_number,
        start_time: game.start_time,
        end_time: game.end_time,
        status: game.status || 'completed',
        game_mode: 'quick',
        created_at: game.created_at || new Date().toISOString()
      }));
      
      setCurrentGame(formattedActiveGame);
      setGameHistory(formattedGameHistory);

      if (formattedActiveGame) {
        await loadCurrentBets();
      }

      // Setup realtime subscriptions
      setTimeout(() => {
        GameInitializationService.setupRealtimeSubscriptions(
          () => loadCurrentData(),
          () => loadCurrentBets()
        );
      }, 1000);

      console.log('Game operations initialized successfully');
    } catch (error) {
      console.error('Game operations initialization error:', error);
    } finally {
      setIsLoading(false);
      isInitializing = false;
    }
  };

  const loadCurrentBets = async () => {
    const gameState = useGameState.getState();
    if (!gameState.currentGame) return;

    try {
      const currentBets = await BetManagementService.loadCurrentBets(
        gameState.currentGame.id,
        gameState.currentGame.id
      );
      console.log('Current bets loaded:', currentBets.length);
      setCurrentBets(currentBets);
    } catch (error) {
      console.error('Error loading current bets:', error);
    }
  };

  const loadCurrentData = async () => {
    try {
      console.log('Reloading current data...');
      const { activeGame, gameHistory } = await GameInitializationService.loadInitialData();
      
      const formattedActiveGame = activeGame ? {
        id: activeGame.id,
        game_number: activeGame.game_number, // Fixed: use game_number consistently
        result_color: activeGame.result_color,
        result_number: activeGame.result_number,
        start_time: activeGame.start_time,
        end_time: activeGame.end_time,
        status: activeGame.status || 'active',
        game_mode: 'quick',
        created_at: activeGame.created_at || new Date().toISOString()
      } : null;

      const formattedGameHistory = gameHistory.map((game: any) => ({
        id: game.id,
        game_number: game.game_number, // Fixed: use game_number consistently
        result_color: game.result_color,
        result_number: game.result_number,
        start_time: game.start_time,
        end_time: game.end_time,
        status: game.status || 'completed',
        game_mode: 'quick',
        created_at: game.created_at || new Date().toISOString()
      }));
      
      setCurrentGame(formattedActiveGame);
      setGameHistory(formattedGameHistory);

      if (formattedActiveGame) {
        await loadCurrentBets();
      }
    } catch (error) {
      console.error('Error loading current data:', error);
    }
  };

  const loadUserGameResults = async (userId: string) => {
    try {
      const userGameResults = await BetHistoryService.loadAllUserBets(userId);
      const gameState = useGameState.getState();
      gameState.setUserGameResults(userGameResults);
    } catch (error) {
      console.error('Error loading user game results:', error);
    }
  };

  return {
    initialize,
    loadCurrentBets,
    loadUserGameResults,
    loadCurrentData
  };
};
