
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Game {
  id: string;
  game_number: number;
  status: string;
  game_mode: string;
  result_number?: number;
  result_color?: string;
  created_at: string;
}

interface GameManagementProps {
  games: Game[];
}

const GameManagement: React.FC<GameManagementProps> = ({ games }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Management</CardTitle>
        <CardDescription>View and manage games</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {games.slice(0, 20).map((game) => (
            <div key={game.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Game #{game.game_number}</p>
                <p className="text-sm text-muted-foreground">Status: {game.status}</p>
                <p className="text-sm text-muted-foreground">Mode: {game.game_mode}</p>
                {game.result_number && (
                  <p className="text-sm">Result: {game.result_number} ({game.result_color})</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm">{new Date(game.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GameManagement;
