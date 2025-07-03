
import React from 'react';

interface BettingStatusMessageProps {
  isAuthenticated: boolean;
  isSystemLoading: boolean;
  currentGame: any;
}

const BettingStatusMessage: React.FC<BettingStatusMessageProps> = ({
  isAuthenticated,
  isSystemLoading,
  currentGame
}) => {
  if (!isAuthenticated) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
        <p className="text-yellow-500 text-sm text-center">
          Please log in to place bets
        </p>
      </div>
    );
  }

  if (isSystemLoading) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
        <p className="text-blue-500 text-sm text-center flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          Loading game data...
        </p>
      </div>
    );
  }

  if (!currentGame && !isSystemLoading && isAuthenticated) {
    return (
      <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg">
        <p className="text-orange-500 text-sm text-center">
          No active game available. Creating new game...
        </p>
      </div>
    );
  }

  return null;
};

export default BettingStatusMessage;
