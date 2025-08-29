
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
  
  const currentModeConfig = GAME_MODES[currentGame?.game_mode_type as keyof typeof GAME_MODES] || GAME_MODES[currentGameMode];
  
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
  
  // Enhanced time formatting with better visual feedback
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

  // Enhanced status display logic
  const getGameStatusInfo = () => {
    if (!currentGame) {
      return {
        status: 'Waiting for Game',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20'
      };
    }

    if (timeRemaining === 0) {
      return {
        status: 'Processing Result',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20'
      };
    }

    if (isAcceptingBets) {
      return {
        status: 'Betting Open',
        color: 'text-green-300',
        bgColor: 'bg-green-500/20'
      };
    } else if (timeRemaining > 0) {
      return {
        status: 'Awaiting Result',
        color: 'text-orange-300',
        bgColor: 'bg-orange-500/20'
      };
    }

    return {
      status: 'Game Ended',
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20'
    };
  };

  const statusInfo = getGameStatusInfo();
  
  // If no results yet, show placeholder with enhanced info
  if (!currentGame && gameHistory.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center h-60 mb-6">
        <div className="animate-spin w-16 h-16 rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-gray-400">Waiting for game to start...</p>
        <div className="mt-4 text-center">
          <p className="text-2xl font-bold text-white">{formatTime(timeRemaining)}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <p className={`text-xs px-3 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color} inline-block`}>
              {statusInfo.status}
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
            <p className="text-sm text-gray-400">Previous Result</p>
            <p className="text-sm font-medium text-white">#{latestResult?.period_number || 'N/A'}</p>
            {latestResult && (
              <div className="flex items-center justify-center gap-1 mt-1">
                <div className={`w-2 h-2 rounded-full ${getColorStyle(latestResult.result_color as ColorType)}`}></div>
                <span className="text-xs text-gray-300">{latestResult.result_number}</span>
              </div>
            )}
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-400">Current Timer</p>
            <div className="flex items-center gap-2">
              {/* Enhanced countdown display that always shows when game is active */}
              <p className={`text-3xl font-mono font-bold transition-colors duration-300 ${
                timeRemaining <= 10 && timeRemaining > 0 ? 'text-red-400 animate-pulse' : 'text-white'
              }`}>
                {formatTime(timeRemaining)}
              </p>
              <span className={`h-3 w-3 rounded-full transition-all duration-300 ${
                isAcceptingBets ? 'bg-green-500 animate-pulse shadow-green-500/50 shadow-lg' : 
                timeRemaining > 0 ? 'bg-orange-500' : 'bg-gray-500'
              }`}></span>
            </div>
            <p className="text-sm font-semibold text-white">Game #{currentGame?.period_number || 'Loading...'}</p>
          </div>
          
          <div className="text-center">
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs text-gray-400">Status</p>
              <p className={`text-sm font-medium px-2 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color} inline-block`}>
                {statusInfo.status}
              </p>
              <p className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 inline-block">
                {currentModeConfig?.name || 'Quick'} ({currentModeConfig?.duration || 60}s)
              </p>
              
              {/* Show betting window info */}
              {timeRemaining > 0 && (
                <p className={`text-xs px-2 py-1 rounded-full ${
                  isAcceptingBets ? 'bg-green-500/20 text-green-300' : 'bg-orange-500/20 text-orange-300'
                }`}>
                  {isAcceptingBets ? `Bet until ${timeRemaining - 2}s` : 'Betting Closed'}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {latestResult && (
          <>
            <h2 className="text-xl font-bold mb-2 text-white">Latest Result</h2>
            <div className="relative">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${getColorStyle(latestResult.result_color as ColorType)} ring-4 ring-white/20`}>
                <span className="text-4xl font-bold text-white">{latestResult.result_number}</span>
              </div>
              <div className="absolute -top-2 -right-2 bg-black/60 rounded-full px-2 py-1 text-xs text-white">
                Game #{latestResult.period_number}
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
          <h3 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
            Recent Results
            <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded-full">
              Last {gameHistory.slice(0, 10).length}
            </span>
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {gameHistory.slice(0, 10).map((result, index) => (
              <div 
                key={result.id} 
                className={`${getColorStyle(result.result_color as ColorType)} p-2 rounded-md flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 ${
                  index === 0 ? 'ring-2 ring-white/40 shadow-lg' : ''
                }`}
              >
                <span className="text-xl font-bold text-white">{result.result_number}</span>
                <span className="text-xs text-white/80 mt-1">#{result.period_number}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-black/20 p-2 rounded text-xs text-gray-400">
          Debug: timeRemaining={timeRemaining}, isAcceptingBets={isAcceptingBets.toString()}, 
          bettingCloses={timeRemaining <= 2 ? 'NOW' : `at ${timeRemaining - 2}s`}
        </div>
      )}
    </div>
  );
};

export default GameArea;
