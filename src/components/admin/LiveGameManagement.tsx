
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AdminGameService, LiveGameStats } from '@/services/adminGameService';
import { toast } from 'sonner';
import { Users, Target, DollarSign, Clock, Play, Square } from 'lucide-react';

const LiveGameManagement: React.FC = () => {
  const [gameStats, setGameStats] = useState<LiveGameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const colors = [
    { value: 'red', label: 'Red', color: 'bg-red-500' },
    { value: 'green', label: 'Green', color: 'bg-green-500' },
    { value: 'purple-red', label: 'Purple Red', color: 'bg-purple-500' }
  ];

  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  useEffect(() => {
    loadGameStats();
    const interval = setInterval(loadGameStats, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (gameStats?.activeGame) {
      setIsManualMode(gameStats.activeGame.game_mode_type === 'manual');
      setSelectedColor(gameStats.activeGame.admin_set_result_color || '');
      setSelectedNumber(gameStats.activeGame.admin_set_result_number || null);
      
      // Calculate time remaining
      const endTime = new Date(gameStats.activeGame.end_time).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeRemaining(remaining);
    }
  }, [gameStats]);

  const loadGameStats = async () => {
    try {
      const stats = await AdminGameService.getCurrentGameStats();
      setGameStats(stats);
    } catch (error) {
      console.error('Error loading game stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = async (manual: boolean) => {
    if (!gameStats?.activeGame) return;

    try {
      const mode = manual ? 'manual' : 'automatic';
      const success = await AdminGameService.setGameMode(gameStats.activeGame.id, mode);
      
      if (success) {
        setIsManualMode(manual);
        await AdminGameService.logAdminAction('change_game_mode', { mode });
        toast.success(`Game mode changed to ${mode}`);
        loadGameStats();
      } else {
        toast.error('Failed to change game mode');
      }
    } catch (error) {
      toast.error('Error changing game mode');
    }
  };

  const handleSetResult = async () => {
    if (!gameStats?.activeGame || !selectedColor || selectedNumber === null) {
      toast.error('Please select both color and number');
      return;
    }

    try {
      const success = await AdminGameService.setManualResult(
        gameStats.activeGame.id,
        selectedColor,
        selectedNumber
      );

      if (success) {
        await AdminGameService.logAdminAction('set_manual_result', {
          color: selectedColor,
          number: selectedNumber,
          gameId: gameStats.activeGame.id
        });
        toast.success(`Result set to ${selectedColor} ${selectedNumber}`);
        loadGameStats();
      } else {
        toast.error('Failed to set result');
      }
    } catch (error) {
      toast.error('Error setting result');
    }
  };

  const handleCompleteGame = async () => {
    if (!gameStats?.activeGame) return;

    try {
      const success = await AdminGameService.completeGameManually(gameStats.activeGame.id);
      
      if (success) {
        await AdminGameService.logAdminAction('complete_game_manually', {
          gameId: gameStats.activeGame.id
        });
        toast.success('Game completed successfully');
        loadGameStats();
      } else {
        toast.error('Failed to complete game');
      }
    } catch (error) {
      toast.error('Error completing game');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!gameStats?.activeGame) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Game Management</CardTitle>
          <CardDescription>No active game found</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gameStats.activePlayers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bets</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gameStats.totalBets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gameStats.totalBetAmount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Left</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timeRemaining}s</div>
          </CardContent>
        </Card>
      </div>

      {/* Game Control */}
      <Card>
        <CardHeader>
          <CardTitle>Game Control - Period #{gameStats.activeGame.period_number}</CardTitle>
          <CardDescription>
            Current Status: <Badge variant={gameStats.activeGame.status === 'active' ? 'default' : 'secondary'}>
              {gameStats.activeGame.status}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="manual-mode"
              checked={isManualMode}
              onCheckedChange={handleModeChange}
            />
            <Label htmlFor="manual-mode">
              Manual Mode {isManualMode ? '(ON)' : '(OFF)'}
            </Label>
          </div>

          {/* Manual Controls */}
          {isManualMode && (
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="text-lg font-semibold">Set Manual Result</h3>
              
              {/* Color Selection */}
              <div>
                <Label>Select Color:</Label>
                <div className="flex gap-2 mt-2">
                  {colors.map(color => (
                    <Button
                      key={color.value}
                      variant={selectedColor === color.value ? 'default' : 'outline'}
                      onClick={() => setSelectedColor(color.value)}
                      className="flex items-center gap-2"
                    >
                      <div className={`w-4 h-4 rounded ${color.color}`}></div>
                      {color.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Number Selection */}
              <div>
                <Label>Select Number:</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {numbers.map(num => (
                    <Button
                      key={num}
                      variant={selectedNumber === num ? 'default' : 'outline'}
                      onClick={() => setSelectedNumber(num)}
                      className="w-10 h-10"
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={handleSetResult} disabled={!selectedColor || selectedNumber === null}>
                  <Play className="h-4 w-4 mr-2" />
                  Set Result
                </Button>
                <Button onClick={handleCompleteGame} variant="destructive">
                  <Square className="h-4 w-4 mr-2" />
                  Complete Game
                </Button>
              </div>

              {/* Current Selection */}
              {selectedColor && selectedNumber !== null && (
                <div className="p-2 bg-muted rounded">
                  <strong>Selected Result:</strong> {selectedColor} {selectedNumber}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Betting Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Color Bets */}
        <Card>
          <CardHeader>
            <CardTitle>Color Bets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {colors.map(color => {
                const bet = gameStats.colorBets[color.value];
                return (
                  <div key={color.value} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${color.color}`}></div>
                      <span>{color.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {bet?.count || 0} bets
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ₹{bet?.amount || 0}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Number Bets */}
        <Card>
          <CardHeader>
            <CardTitle>Number Bets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {numbers.map(num => {
                const bet = gameStats.numberBets[num.toString()];
                return (
                  <div key={num} className="flex items-center justify-between p-2 border rounded text-sm">
                    <span className="font-semibold">{num}</span>
                    <div className="text-right">
                      <div>{bet?.count || 0} bets</div>
                      <div className="text-xs text-muted-foreground">₹{bet?.amount || 0}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveGameManagement;
