
import React from 'react';
import useGameStore from '@/store/gameStore';
import { ColorType, NumberType } from '@/types/game';

const GameArea: React.FC = () => {
  const { lastResults, timeRemaining, currentGameId, isAcceptingBets } = useGameStore();
  
  const getColorStyle = (color: ColorType) => {
    switch (color) {
      case 'red':
        return 'bg-game-red';
      case 'green':
        return 'bg-game-green';
      case 'purple-red':
        return 'bg-game-purple-red';
      default:
        return '';
    }
  };
  
  // If no results yet, show placeholder
  if (lastResults.length === 0) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center h-60 mb-6">
        <div className="animate-spin-slow w-16 h-16 rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-muted-foreground">Waiting for first game results...</p>
        <div className="mt-4 text-center">
          <p className="text-2xl font-bold">{timeRemaining}s</p>
          <p className="text-sm text-muted-foreground">Game #{currentGameId}</p>
          <p className="text-xs mt-2 px-3 py-1 rounded-full bg-primary/20 inline-block">
            {isAcceptingBets ? 'Betting Open' : 'Betting Closed'}
          </p>
        </div>
      </div>
    );
  }
  
  // Get the most recent result
  const latestResult = lastResults[0];
  
  return (
    <div className="glass-panel p-6 mb-6 space-y-6">
      <div className="flex flex-col items-center justify-center">
        <div className="w-full flex justify-between items-center mb-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Previous Game</p>
            <p className="text-sm font-medium">#{latestResult.gameId}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Current</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{timeRemaining}s</p>
              <span className={`h-2 w-2 rounded-full ${isAcceptingBets ? 'bg-game-green animate-pulse' : 'bg-game-red'}`}></span>
            </div>
            <p className="text-sm font-semibold">Game #{currentGameId}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-sm font-medium px-2 py-1 rounded-full bg-primary/20 inline-block">
              {isAcceptingBets ? 'Betting Open' : 'Betting Closed'}
            </p>
          </div>
        </div>
        
        <h2 className="text-xl font-bold mb-2">Latest Result</h2>
        <div className="relative">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${getColorStyle(latestResult.resultColor)}`}>
            <span className="text-4xl font-bold text-white">{latestResult.resultNumber}</span>
          </div>
          <div className="absolute -top-2 -right-2 bg-black/60 rounded-full px-2 py-1 text-xs">
            Game #{latestResult.gameId}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getColorStyle(latestResult.resultColor)}`}></div>
          <span className="text-lg capitalize">{latestResult.resultColor.replace('-', ' ')}</span>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Recent Results</h3>
        <div className="grid grid-cols-5 gap-2">
          {lastResults.slice(0, 10).map((result, index) => (
            <div 
              key={result.id} 
              className={`${getColorStyle(result.resultColor)} p-2 rounded-md flex flex-col items-center justify-center ${index === 0 ? 'ring-2 ring-white/20' : ''}`}
            >
              <span className="text-xl font-bold text-white">{result.resultNumber}</span>
              <span className="text-xs text-white/80 mt-1">#{result.gameId}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameArea;
