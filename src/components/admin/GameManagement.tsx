
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GameManagementProps {
  games: any[];
}

const GameManagement: React.FC<GameManagementProps> = ({ games }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Management</CardTitle>
        <CardDescription>View and manage games</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Game #</th>
                <th className="border border-gray-300 p-2 text-left">Mode</th>
                <th className="border border-gray-300 p-2 text-left">Status</th>
                <th className="border border-gray-300 p-2 text-left">Result</th>
                <th className="border border-gray-300 p-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {games.map(game => (
                <tr key={game.id}>
                  <td className="border border-gray-300 p-2">{game.game_number}</td>
                  <td className="border border-gray-300 p-2">{game.game_mode}</td>
                  <td className="border border-gray-300 p-2">
                    <Badge variant={game.status === 'completed' ? 'default' : 'secondary'}>
                      {game.status}
                    </Badge>
                  </td>
                  <td className="border border-gray-300 p-2">
                    {game.result_color && game.result_number ? 
                      `${game.result_color} ${game.result_number}` : 'Pending'}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {new Date(game.created_at).toLocaleDateString()}
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

export default GameManagement;
