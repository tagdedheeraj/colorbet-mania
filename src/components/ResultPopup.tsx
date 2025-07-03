
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import useSupabaseGameStore from '@/store/supabaseGameStore';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { BetHistoryService } from '@/services/betHistoryService';
import { ColorType } from '@/types/supabaseGame';

const ResultPopup: React.FC = () => {
  const { showResultPopup, lastCompletedGame, closeResultPopup } = useSupabaseGameStore();
  const { user } = useSupabaseAuthStore();
  const [userBetsResult, setUserBetsResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showResultPopup && lastCompletedGame && user) {
      loadUserBetsForGame();
    }
  }, [showResultPopup, lastCompletedGame, user]);

  const loadUserBetsForGame = async () => {
    if (!user || !lastCompletedGame) return;
    
    setLoading(true);
    try {
      const allUserBets = await BetHistoryService.loadAllUserBets(user.id);
      const gameBets = allUserBets.filter(bet => bet.game_id === lastCompletedGame.id);
      
      if (gameBets.length > 0) {
        const totalBetAmount = gameBets.reduce((sum, bet) => sum + bet.amount, 0);
        const totalWinAmount = gameBets.reduce((sum, bet) => sum + (bet.actual_win || 0), 0);
        const netResult = totalWinAmount - totalBetAmount;
        
        setUserBetsResult({
          bets: gameBets,
          totalBetAmount,
          totalWinAmount,
          netResult,
          hasWinner: gameBets.some(bet => bet.is_winner)
        });
      } else {
        setUserBetsResult(null);
      }
    } catch (error) {
      console.error('Error loading user bets for game:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorStyle = (color: ColorType) => {
    switch (color) {
      case 'red':
        return 'bg-game-red text-white';
      case 'green':
        return 'bg-game-green text-white';
      case 'purple-red':
        return 'bg-game-purple-red text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (!showResultPopup || !lastCompletedGame) return null;

  return (
    <Dialog open={showResultPopup} onOpenChange={closeResultPopup}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Game Result</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Game Result */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Game #{lastCompletedGame.game_number}
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className={`px-4 py-2 rounded-lg text-lg font-semibold ${getColorStyle(lastCompletedGame.result_color as ColorType)}`}>
                {lastCompletedGame.result_color === 'purple-red' ? 'Purple Red' : lastCompletedGame.result_color}
              </div>
              <div className={`w-12 h-12 rounded-full ${getColorStyle(lastCompletedGame.result_color as ColorType)} flex items-center justify-center`}>
                <span className="text-lg font-bold">{lastCompletedGame.result_number}</span>
              </div>
            </div>
          </div>

          {/* User Result */}
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading your results...</p>
            </div>
          ) : userBetsResult ? (
            <div className="space-y-3">
              <div className="border-t pt-3">
                <h3 className="font-semibold text-center mb-3">Your Result</h3>
                
                {/* Net Result */}
                <div className="text-center mb-3">
                  <div className={`text-2xl font-bold ${
                    userBetsResult.netResult > 0 ? 'text-game-green' : 
                    userBetsResult.netResult < 0 ? 'text-game-red' : 'text-muted-foreground'
                  }`}>
                    {userBetsResult.netResult > 0 ? `+${userBetsResult.netResult.toFixed(2)}` : 
                     userBetsResult.netResult < 0 ? `${userBetsResult.netResult.toFixed(2)}` : '0.00'} coins
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {userBetsResult.netResult > 0 ? 'Congratulations! You won!' : 
                     userBetsResult.netResult < 0 ? 'Better luck next time!' : 'Break even'}
                  </p>
                </div>

                {/* Bet Details */}
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground text-center">Your bets:</div>
                  {userBetsResult.bets.map((bet: any) => (
                    <div key={bet.id} className="flex items-center justify-between text-sm p-2 bg-secondary/30 rounded">
                      <span>
                        {bet.bet_type === 'color' ? 
                          (bet.bet_value === 'purple-red' ? 'Purple Red' : bet.bet_value) : 
                          `Number ${bet.bet_value}`}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{bet.amount} coins</span>
                        <span className={bet.is_winner ? "text-game-green font-semibold" : "text-game-red"}>
                          {bet.is_winner ? `+${bet.actual_win || bet.potential_win}` : 'Loss'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">You didn't place any bets in this game.</p>
            </div>
          )}

          {/* Close Button */}
          <div className="pt-4">
            <Button onClick={closeResultPopup} className="w-full">
              Continue Playing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResultPopup;
