
import React from 'react';
import useGameStore from '@/store/gameStore';
import { ColorType } from '@/types/game';

const GameHistory: React.FC = () => {
  const { lastResults } = useGameStore();
  
  const getColorStyle = (color: ColorType) => {
    switch (color) {
      case 'red':
        return 'bg-game-red text-white';
      case 'green':
        return 'bg-game-green text-white';
      case 'purple-red':
        return 'bg-game-purple-red text-white';
      default:
        return '';
    }
  };
  
  if (lastResults.length === 0) {
    return (
      <div className="glass-panel p-4">
        <h3 className="text-lg font-semibold mb-2">Game History</h3>
        <p className="text-muted-foreground text-sm">No games played yet.</p>
      </div>
    );
  }
  
  return (
    <div className="glass-panel p-4">
      <h3 className="text-lg font-semibold mb-3">Game History</h3>
      <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
        {lastResults.map((result) => (
          <div key={result.id} className="glass-panel bg-secondary/30 p-3 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Game #{result.gameId}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(result.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-2 py-1 rounded text-xs font-medium truncate max-w-[80px] ${getColorStyle(result.resultColor)}`}>
                {result.resultColor === 'purple-red' ? 'Purple Red' : result.resultColor}
              </div>
              <div className={`w-6 h-6 rounded-full ${getColorStyle(result.resultColor)} flex items-center justify-center`}>
                <span className="text-xs font-bold">{result.resultNumber}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameHistory;
