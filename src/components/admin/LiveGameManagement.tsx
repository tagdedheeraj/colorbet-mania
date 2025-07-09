import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AdminGameService, LiveGameStats } from '@/services/adminGameService';
import { toast } from 'sonner';
import { Users, Target, DollarSign, Clock, Play, Square, RefreshCw } from 'lucide-react';

const LiveGameManagement: React.FC = () => {
  const [gameStats, setGameStats] = useState<LiveGameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  useEffect(() => {
    loadGameStats();
    const interval = setInterval(loadGameStats, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (gameStats?.activeGame) {
      const mode = gameStats.activeGame.game_mode_type === 'manual';
      setIsManualMode(mode);
      setSelectedNumber(gameStats.activeGame.admin_set_result_number || null);
      
      // Calculate time remaining
      if (gameStats.activeGame.end_time) {
        const endTime = new Date(gameStats.activeGame.end_time).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeRemaining(remaining);
      }
    }
  }, [gameStats]);

  const loadGameStats = async () => {
    try {
      console.log('Loading game stats...');
      const stats = await AdminGameService.getCurrentGameStats();
      console.log('Game stats loaded:', stats);
      setGameStats(stats);
    } catch (error) {
      console.error('Error loading game stats:', error);
      if (loading) {
        toast.error('Failed to load game statistics');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = async (manual: boolean) => {
    if (!gameStats?.activeGame) {
      toast.error('No active game found');
      return;
    }

    setActionLoading(true);
    try {
      const mode = manual ? 'manual' : 'automatic';
      console.log(`Changing game mode to: ${mode}`);
      
      const success = await AdminGameService.setGameMode(gameStats.activeGame.id, mode);
      
      if (success) {
        setIsManualMode(manual);
        await AdminGameService.logAdminAction('change_game_mode', { 
          gameId: gameStats.activeGame.id,
          mode 
        });
        toast.success(`Game mode changed to ${mode}`);
        setTimeout(loadGameStats, 1000);
      } else {
        toast.error('Failed to change game mode');
      }
    } catch (error) {
      console.error('Error changing game mode:', error);
      toast.error('Error changing game mode');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetResult = async () => {
    if (!gameStats?.activeGame || selectedNumber === null) {
      toast.error('Please select a number (0-9)');
      return;
    }

    setActionLoading(true);
    try {
      console.log(`Setting manual result: ${selectedNumber}`);
      
      const success = await AdminGameService.setManualResult(
        gameStats.activeGame.id,
        selectedNumber
      );

      if (success) {
        await AdminGameService.logAdminAction('set_manual_result', {
          number: selectedNumber,
          gameId: gameStats.activeGame.id
        });
        toast.success(`Result set to ${selectedNumber}`);
        setTimeout(loadGameStats, 1000);
      } else {
        toast.error('Failed to set result');
      }
    } catch (error) {
      console.error('Error setting result:', error);
      toast.error('Error setting result');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteGame = async () => {
    if (!gameStats?.activeGame) {
      toast.error('No active game found');
      return;
    }

    setActionLoading(true);
    try {
      console.log('Completing game manually...');
      
      const success = await AdminGameService.completeGameManually(gameStats.activeGame.id);
      
      if (success) {
        await AdminGameService.logAdminAction('complete_game_manually', {
          gameId: gameStats.activeGame.id
        });
        toast.success('Game completed successfully');
        setTimeout(loadGameStats, 1000);
      } else {
        toast.error('Failed to complete game');
      }
    } catch (error) {
      console.error('Error completing game:', error);
      toast.error('Error completing game');
    } finally {
      setActionLoading(false);
    }
  };

  const getColorForNumber = (num: number): string => {
    if ([1, 3, 7, 9].includes(num)) return 'red';
    if ([2, 4, 6, 8].includes(num)) return 'green';
    if ([0, 5].includes(num)) return 'purple-red';
    return 'red';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading game data...</span>
      </div>
    );
  }

  if (!gameStats?.activeGame) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Live Game Management
            <Button onClick={loadGameStats} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>No active game found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            There are currently no active games. Games are managed automatically by the system.
          </p>
        </CardContent>
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
            <div className="text-2xl font-bold">₹{gameStats.totalBetAmount.toFixed(2)}</div>
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
          <CardTitle className="flex items-center justify-between">
            Game Control - Game #{gameStats.activeGame.game_number}
            <Button onClick={loadGameStats} variant="outline" size="sm" disabled={actionLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Current Status: <Badge variant={gameStats.activeGame.status === 'active' ? 'default' : 'secondary'}>
              {gameStats.activeGame.status}
            </Badge>
            {' | Mode: '}
            <Badge variant={isManualMode ? 'destructive' : 'secondary'}>
              {isManualMode ? 'Manual' : 'Automatic'}
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
              disabled={actionLoading}
            />
            <Label htmlFor="manual-mode">
              Manual Mode {isManualMode ? '(ON)' : '(OFF)'}
            </Label>
          </div>

          {/* Manual Controls */}
          {isManualMode && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
              <h3 className="text-lg font-semibold">Set Manual Result</h3>
              
              {/* Number Selection */}
              <div>
                <Label>Select Number (0-9):</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {numbers.map(num => (
                    <Button
                      key={num}
                      variant={selectedNumber === num ? 'default' : 'outline'}
                      onClick={() => setSelectedNumber(num)}
                      disabled={actionLoading}
                      className="w-12 h-12 text-lg font-bold"
                    >
                      {num}
                    </Button>
                  ))}
                </div>
                
                {/* Number Input Alternative */}
                <div className="mt-3">
                  <Label htmlFor="number-input">Or enter number directly:</Label>
                  <Input
                    id="number-input"
                    type="number"
                    min="0"
                    max="9"
                    value={selectedNumber ?? ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 0 && val <= 9) {
                        setSelectedNumber(val);
                      } else if (e.target.value === '') {
                        setSelectedNumber(null);
                      }
                    }}
                    className="w-24"
                    placeholder="0-9"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleSetResult} 
                  disabled={selectedNumber === null || actionLoading}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {actionLoading ? 'Setting...' : 'Set Result'}
                </Button>
                <Button onClick={handleCompleteGame} variant="destructive" disabled={actionLoading}>
                  <Square className="h-4 w-4 mr-2" />
                  {actionLoading ? 'Completing...' : 'Complete Game'}
                </Button>
              </div>

              {/* Current Selection with Color Preview */}
              {selectedNumber !== null && (
                <div className="p-3 bg-primary/10 rounded border">
                  <strong>Selected Result:</strong> {selectedNumber}
                  <br />
                  <strong>Color will be:</strong> <span className={`px-2 py-1 rounded text-white ${
                    getColorForNumber(selectedNumber) === 'red' ? 'bg-red-500' :
                    getColorForNumber(selectedNumber) === 'green' ? 'bg-green-500' :
                    'bg-purple-500'
                  }`}>
                    {getColorForNumber(selectedNumber) === 'purple-red' ? 'Purple-Red' : getColorForNumber(selectedNumber)}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Number Bets */}
      <Card>
        <CardHeader>
          <CardTitle>Number Bets Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {numbers.map(num => {
              const bet = gameStats.numberBets[num.toString()];
              const color = getColorForNumber(num);
              return (
                <div key={num} className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg ${
                  color === 'red' ? 'border-red-200 bg-red-50' :
                  color === 'green' ? 'border-green-200 bg-green-50' :
                  'border-purple-200 bg-purple-50'
                }`}>
                  <span className={`text-2xl font-bold ${
                    color === 'red' ? 'text-red-600' :
                    color === 'green' ? 'text-green-600' :
                    'text-purple-600'
                  }`}>{num}</span>
                  <div className="text-sm text-center">
                    <div className="font-semibold">{bet?.count || 0} bets</div>
                    <div className="text-xs text-muted-foreground">₹{bet?.amount?.toFixed(2) || '0.00'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveGameManagement;
