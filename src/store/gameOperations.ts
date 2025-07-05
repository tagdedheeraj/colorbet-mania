
import { GameService } from '@/services/gameService';
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
    currentGame,
    currentGameMode
  } = useGameState();

  const initialize = async () => {
    if (isInitializing) return;
    isInitializing = true;

    console.log('Initializing game store...');
    setIsLoading(true);
    
    try {
      // Set timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.log('Game initialization timeout');
        setIsLoading(false);
        isInitializing = false;
      }, 8000);

      // First clean up old active games
      await GameInitializationService.cleanupOldGames();

      // Load game history (fast operation)
      const gameHistory = await GameService.loadGameHistory();
      setGameHistory(gameHistory);

      // Try to load or create active game
      let activeGame = await GameService.loadActiveGame();
      
      if (!activeGame) {
        console.log('No active game found, creating new game...');
        await GameInitializationService.createDemoGameIfNeeded(currentGameMode);
        activeGame = await GameService.loadActiveGame();
      }

      clearTimeout(timeout);
      
      setCurrentGame(activeGame);
      setIsLoading(false);

      if (activeGame) {
        await loadCurrentBets();
      }

      // Setup realtime subscriptions (non-blocking)
      setTimeout(() => {
        GameInitializationService.setupRealtimeSubscriptions(
          () => loadCurrentData(),
          () => loadCurrentBets()
        );
      }, 1000);

      console.log('Game store initialized successfully');
      isInitializing = false;
    } catch (error) {
      console.error('Game store initialization error:', error);
      setIsLoading(false);
      isInitializing = false;
    }
  };

  const createDemoGameIfNeeded = async () => {
    try {
      const gameState = useGameState.getState();
      await GameInitializationService.createDemoGameIfNeeded(gameState.currentGameMode);
    } catch (error) {
      console.error('Error creating demo game:', error);
    }
  };

  const loadGameHistory = async () => {
    try {
      const gameHistory = await GameService.loadGameHistory();
      setGameHistory(gameHistory);
    } catch (error) {
      console.error('Error loading game history:', error);
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

  const loadUserGameResults = async (userId: string) => {
    try {
      const userGameResults = await BetHistoryService.loadAllUserBets(userId);
      const gameState = useGameState.getState();
      gameState.setUserGameResults(userGameResults);
    } catch (error) {
      console.error('Error loading user game results:', error);
    }
  };

  const loadCurrentData = async () => {
    try {
      console.log('Loading current data...');
      const { activeGame, gameHistory } = await GameInitializationService.loadInitialData();
      
      const gameState = useGameState.getState();
      const prevGame = gameState.currentGame;
      const gameChanged = !prevGame || prevGame.id !== activeGame?.id;
      
      // Convert activeGame to SupabaseGame format if it exists
      const formattedActiveGame = activeGame ? {
        id: activeGame.id,
        game_number: activeGame.period_number,
        result_color: activeGame.result_color,
        result_number: activeGame.result_number,
        start_time: activeGame.start_time,
        end_time: activeGame.end_time,
        status: activeGame.status || 'active',
        game_mode: 'quick', // Default since not in schema
        created_at: activeGame.created_at || new Date().toISOString()
      } : null;

      // Transform gameHistory to match SupabaseGame format
      const formattedGameHistory = gameHistory.map((game: any) => ({
        id: game.id,
        game_number: game.period_number,
        result_color: game.result_color,
        result_number: game.result_number,
        start_time: game.start_time,
        end_time: game.end_time,
        status: game.status || 'completed',
        game_mode: 'quick', // Default since not in schema
        created_at: game.created_at || new Date().toISOString()
      }));
      
      setCurrentGame(formattedActiveGame);
      setGameHistory(formattedGameHistory);

      if (formattedActiveGame && gameChanged) {
        console.log('Game changed, updating bets');
        await loadCurrentBets();
      } else if (formattedActiveGame) {
        await loadCurrentBets();
      }
    } catch (error) {
      console.error('Error loading current data:', error);
    }
  };

  return {
    initialize,
    createDemoGameIfNeeded,
    loadGameHistory,
    loadCurrentBets,
    loadUserGameResults,
    loadCurrentData
  };
};
