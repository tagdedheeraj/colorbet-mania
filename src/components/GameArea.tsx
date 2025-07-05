
import React from 'react';
import { useGameState } from '@/store/gameState';
import { ColorType } from '@/types/supabaseGame';
import { GAME_MODES } from '@/config/gameModes';

const GameArea: React.FC = () => {
  const { 
    gameHistory,
    timeRemaining, 
    currentGame, 
    isAcceptingBets,
    currentGameMode
  } = useGameState();
  
  const currentModeConfig = GAME_MODES[currentGame?.game_mode || currentGameMode];
  
  const getColorStyle = (color: ColorType | string) => {
    switch (color) {
      case 'red':
        return 'bg-red-500';
      case 'green':
        return 'bg-green-500';
      case 'purple-red':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Format time to display minutes and seconds
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Get a display-friendly color name with null safety
  const getColorDisplayName = (color: ColorType | string | null | undefined): string => {
    if (!color || color === null || color === undefined) {
      return 'Unknown';
    }
    return color === 'purple-red' ? 'Purple' : String(color).charAt(0).toUpperCase() + String(color).slice(1);
  };
  
  // If no results yet, show placeholder
  if (!currentGame && gameHistory.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center h-60 mb-6">
        <div className="animate-spin w-16 h-16 rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-gray-400">Waiting for game to start...</p>
        <div className="mt-4 text-center">
          <p className="text-2xl font-bold text-white">{formatTime(timeRemaining)}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <p className={`text-xs px-3 py-1 rounded-full ${isAcceptingBets ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'} inline-block`}>
              {isAcceptingBets ? 'Betting Open' : 'Betting Closed'}
            </p>
            <p className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 inline-block">
              {currentModeConfig?.name || 'Quick'} Mode ({currentModeConfig?.duration || 60}s)
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Get the most recent result from game history
  const latestResult = gameHistory[0];
  
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6 space-y-6">
      <div className="flex flex-col items-center justify-center">
        <div className="w-full flex justify-between items-center mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-400">Previous Game</p>
            <p className="text-sm font-medium text-white">#{latestResult?.game_number || 'N/A'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Current</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-white">{formatTime(timeRemaining)}</p>
              <span className={`h-2 w-2 rounded-full ${isAcceptingBets ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            </div>
            <p className="text-sm font-semibold text-white">Game #{currentGame?.game_number || 'Loading...'}</p>
          </div>
          <div className="text-center">
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs text-gray-400">Status</p>
              <p className={`text-sm font-medium px-2 py-1 rounded-full ${isAcceptingBets ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'} inline-block`}>
                {isAcceptingBets ? 'Betting Open' : 'Betting Closed'}
              </p>
              <p className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 inline-block">
                {currentModeConfig?.name || 'Quick'} ({currentModeConfig?.duration || 60}s)
              </p>
            </div>
          </div>
        </div>
        
        {latestResult && (
          <>
            <h2 className="text-xl font-bold mb-2 text-white">Latest Result</h2>
            <div className="relative">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${getColorStyle(latestResult.result_color as ColorType)}`}>
                <span className="text-4xl font-bold text-white">{latestResult.result_number}</span>
              </div>
              <div className="absolute -top-2 -right-2 bg-black/60 rounded-full px-2 py-1 text-xs text-white">
                Game #{latestResult.game_number}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getColorStyle(latestResult.result_color as ColorType)}`}></div>
              <span className="text-lg capitalize text-white">{getColorDisplayName(latestResult.result_color as ColorType)}</span>
            </div>
          </>
        )}
      </div>
      
      {gameHistory.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-white">Recent Results</h3>
          <div className="grid grid-cols-5 gap-2">
            {gameHistory.slice(0, 10).map((result, index) => (
              <div 
                key={result.id} 
                className={`${getColorStyle(result.result_color as ColorType)} p-2 rounded-md flex flex-col items-center justify-center ${index === 0 ? 'ring-2 ring-white/20' : ''}`}
              >
                <span className="text-xl font-bold text-white">{result.result_number}</span>
                <span className="text-xs text-white/80 mt-1">#{result.game_number}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameArea;
