
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Bet {
  id: string;
  amount: number;
  bet_type: string;
  is_winner: boolean;
  actual_win: number;
  created_at: string;
  users?: {
    username: string;
  };
  games?: {
    game_number: number;
  };
}

interface BettingAnalyticsProps {
  bets: Bet[];
}

const BettingAnalytics: React.FC<BettingAnalyticsProps> = ({ bets }) => {
  const totalBetsAmount = bets.reduce((sum, bet) => sum + (bet.amount || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Betting Analytics</CardTitle>
        <CardDescription>View betting history and analytics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <p><strong>Total Bets Volume:</strong> ₹{totalBetsAmount.toFixed(2)}</p>
          <p><strong>Average Bet:</strong> ₹{bets.length > 0 ? (totalBetsAmount / bets.length).toFixed(2) : '0'}</p>
        </div>
        <div className="space-y-4">
          {bets.slice(0, 20).map((bet) => (
            <div key={bet.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">₹{bet.amount} on {bet.bet_type}</p>
                <p className="text-sm text-muted-foreground">
                  User: {bet.users?.username || 'Unknown'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Game: #{bet.games?.game_number || 'Unknown'}
                </p>
                <p className="text-sm">
                  Result: {bet.is_winner ? `Won ₹${bet.actual_win}` : 'Lost'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">{new Date(bet.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BettingAnalytics;
