
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BettingAnalyticsProps {
  bets: any[];
}

const BettingAnalytics: React.FC<BettingAnalyticsProps> = ({ bets }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Betting Analytics</CardTitle>
        <CardDescription>View all betting activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">User</th>
                <th className="border border-gray-300 p-2 text-left">Game #</th>
                <th className="border border-gray-300 p-2 text-left">Bet</th>
                <th className="border border-gray-300 p-2 text-left">Amount</th>
                <th className="border border-gray-300 p-2 text-left">Result</th>
                <th className="border border-gray-300 p-2 text-left">Win Amount</th>
                <th className="border border-gray-300 p-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {bets.map(bet => (
                <tr key={bet.id}>
                  <td className="border border-gray-300 p-2">{bet.users?.username}</td>
                  <td className="border border-gray-300 p-2">{bet.games?.game_number}</td>
                  <td className="border border-gray-300 p-2">
                    {bet.bet_type === 'color' ? bet.bet_value : `Number ${bet.bet_value}`}
                  </td>
                  <td className="border border-gray-300 p-2">{bet.amount}</td>
                  <td className="border border-gray-300 p-2">
                    <Badge variant={bet.is_winner ? 'default' : 'destructive'}>
                      {bet.is_winner ? 'Win' : 'Loss'}
                    </Badge>
                  </td>
                  <td className="border border-gray-300 p-2">
                    {bet.actual_win || 0}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {new Date(bet.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BettingAnalytics;
