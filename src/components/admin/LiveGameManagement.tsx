
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AdminGameService, LiveGameStats } from '@/services/adminGameService';
import { ManualGameService } from '@/services/admin/manualGameService';
import { toast } from 'sonner';
import { Users, Target, DollarSign, Clock, Play, Square, RefreshCw, AlertTriangle, CheckCircle, Settings, Info, Pause, Timer } from 'lucide-react';
import DetailedBettingAnalytics from './DetailedBettingAnalytics';

const LiveGameManagement: React.FC = () => {
  const [gameStats, setGameStats] = useState<LiveGameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [timerPaused, setTimerPaused] = useState(false);

  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  useEffect(() => {
    loadGameStats();
    const interval = setInterval(loadGameStats, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (gameStats?.activeGame) {
      const mode = gameStats.activeGame.game_mode_type === 'manual';
      const paused = gameStats.activeGame.timer_paused === true;
      
      setIsManualMode(mode);
      setTimerPaused(paused);
      setSelectedNumber(gameStats.activeGame.admin_set_result_number || null);
      
      // Calculate time remaining
      if (gameStats.activeGame.end_time && !paused) {
        const endTime = new Date(gameStats.activeGame.end_time).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeRemaining(remaining);
      } else if (paused) {
        setTimeRemaining(0); // Show 0 when paused
      }
    }
  }, [gameStats]);

  const loadGameStats = async () => {
    try {
      console.log('📊 Loading game stats...');
      const stats = await AdminGameService.getCurrentGameStats();
      console.log('✅ Game stats loaded:', stats);
      setGameStats(stats);
      setLastError(null);
      setDebugInfo(null);
    } catch (error) {
      console.error('❌ Error loading game stats:', error);
      setLastError('Failed to load game statistics');
      if (loading) {
        toast.error('Failed to load game statistics');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = async (manual: boolean) => {
    if (!gameStats?.activeGame) {
      const error = 'No active game found';
      setLastError(error);
      toast.error(error);
      return;
    }

    setActionLoading(true);
    setLastError(null);
    setDebugInfo(null);
    
    try {
      const mode = manual ? 'manual' : 'automatic';
      console.log(`🔄 Changing game mode to: ${mode} for game ${gameStats.activeGame.id}`);
      
      const success = await ManualGameService.setManualMode(gameStats.activeGame.id, manual);
      
      if (success) {
        setIsManualMode(manual);
        setTimerPaused(manual);
        
        toast.success(`Game mode changed to ${mode}`, {
          description: `Game #${gameStats.activeGame.game_number} is now in ${mode} mode${manual ? ' with timer paused' : ''}`,
          icon: manual ? <Pause className="h-4 w-4" /> : <Timer className="h-4 w-4" />
        });
        
        setTimeout(loadGameStats, 1000);
      } else {
        const error = `Failed to change game mode to ${mode}`;
        setLastError(error);
        toast.error(error, {
          description: 'Please check the console for detailed error information',
          icon: <AlertTriangle className="h-4 w-4" />
        });
      }
    } catch (error) {
      console.error('❌ Exception changing game mode:', error);
      const errorMsg = 'Error changing game mode';
      setLastError(errorMsg);
      toast.error(errorMsg, {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetResult = async () => {
    if (!gameStats?.activeGame || selectedNumber === null) {
      const error = 'Please select a number (0-9)';
      setLastError(error);
      toast.error(error);
      return;
    }

    setActionLoading(true);
    setLastError(null);
    setDebugInfo(null);
    
    try {
      console.log(`🎯 Setting manual result: ${selectedNumber} for game ${gameStats.activeGame.id}`);
      
      const success = await AdminGameService.setManualResult(
        gameStats.activeGame.id,
        selectedNumber
      );

      if (success) {
        toast.success(`Result set to ${selectedNumber}`, {
          description: `Manual result has been set for Game #${gameStats.activeGame.game_number} - Timer remains paused`,
          icon: <CheckCircle className="h-4 w-4" />
        });
        
        setTimeout(loadGameStats, 1000);
      } else {
        const error = 'Failed to set result';
        setLastError(error);
        setDebugInfo({
          gameId: gameStats.activeGame.id,
          selectedNumber,
          gameStatus: gameStats.activeGame.status,
          gameMode: gameStats.activeGame.game_mode_type,
          timerPaused: gameStats.activeGame.timer_paused
        });
        toast.error(error, {
          description: 'Check console logs for detailed information',
          icon: <AlertTriangle className="h-4 w-4" />
        });
      }
    } catch (error) {
      console.error('❌ Exception setting result:', error);
      const errorMsg = 'Error setting result';
      setLastError(errorMsg);
      toast.error(errorMsg, {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteGame = async () => {
    if (!gameStats?.activeGame) {
      const error = 'No active game found';
      setLastError(error);
      toast.error(error);
      return;
    }

    if (!gameStats.activeGame.manual_result_set) {
      const error = 'Please set a result before completing the game';
      setLastError(error);
      toast.error(error);
      return;
    }

    setActionLoading(true);
    setLastError(null);
    setDebugInfo(null);
    
    try {
      console.log(`🏁 Completing game manually: ${gameStats.activeGame.id}`);
      
      const success = await AdminGameService.completeGameManually(gameStats.activeGame.id);
      
      if (success) {
        toast.success('Game completed successfully', {
          description: `Game #${gameStats.activeGame.game_number} has been completed manually with the set result`,
          icon: <CheckCircle className="h-4 w-4" />
        });
        
        setTimeout(loadGameStats, 2000);
      } else {
        const error = 'Failed to complete game';
        setLastError(error);
        toast.error(error, {
          description: 'Please check admin permissions and try again'
        });
      }
    } catch (error) {
      console.error('❌ Exception completing game:', error);
      const errorMsg = 'Error completing game';
      setLastError(errorMsg);
      toast.error(errorMsg, {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
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
          <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg">
            <Info className="h-5 w-5 text-muted-foreground" />
            <p className="text-muted-foreground">
              There are currently no active games. Games are managed automatically by the system.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display with Debug Info */}
      {lastError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive mb-3">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Error: {lastError}</span>
            </div>
            {debugInfo && (
              <div className="mt-2 p-3 bg-muted rounded text-sm">
                <strong>Debug Information:</strong>
                <pre className="mt-1 text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Detailed Betting Analytics */}
      <DetailedBettingAnalytics 
        gameId={gameStats.activeGame.id}
        autoRefresh={true}
        refreshInterval={5000}
      />

      {/* Game Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Enhanced Game Control - Game #{gameStats.activeGame.game_number}
            </div>
            <Button onClick={loadGameStats} variant="outline" size="sm" disabled={actionLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            <div className="flex flex-wrap items-center gap-2">
              <span>Status:</span>
              <Badge variant={gameStats.activeGame.status === 'active' ? 'default' : 'secondary'}>
                {gameStats.activeGame.status}
              </Badge>
              <span>| Mode:</span>
              <Badge variant={isManualMode ? 'destructive' : 'secondary'}>
                {isManualMode ? 'Manual' : 'Automatic'}
              </Badge>
              {timerPaused && (
                <>
                  <span>| Timer:</span>
                  <Badge variant="outline" className="text-orange-600">
                    <Pause className="h-3 w-3 mr-1" />
                    Paused
                  </Badge>
                </>
              )}
              {gameStats.activeGame.admin_set_result_number !== null && (
                <>
                  <span>| Set Result:</span>
                  <Badge variant="outline">
                    {gameStats.activeGame.admin_set_result_number}
                  </Badge>
                </>
              )}
              {gameStats.activeGame.manual_result_set && (
                <>
                  <span>| Result Ready:</span>
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ready to Complete
                  </Badge>
                </>
              )}
            </div>
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
              Manual Mode {isManualMode ? '(ON - Timer Paused)' : '(OFF - Auto Timer)'}
            </Label>
            {timerPaused && (
              <Badge variant="outline" className="ml-2 text-orange-600">
                <Pause className="h-3 w-3 mr-1" />
                Timer Override Active
              </Badge>
            )}
          </div>

          {/* Manual Controls */}
          {isManualMode && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold">Enhanced Manual Game Control</h3>
                <Badge variant="outline" className="text-blue-600">
                  Timer Protected
                </Badge>
              </div>
              
              {/* Number Selection */}
              <div>
                <Label>Select Result Number (0-9):</Label>
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
                    disabled={actionLoading}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleSetResult} 
                  disabled={selectedNumber === null || actionLoading}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {actionLoading ? 'Setting...' : 'Set Result'}
                </Button>
                <Button 
                  onClick={handleCompleteGame} 
                  variant="destructive" 
                  disabled={actionLoading || !gameStats.activeGame.manual_result_set}
                >
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

              {/* Manual Mode Status */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center gap-2 text-blue-800">
                  <Info className="h-4 w-4" />
                  <strong>Manual Mode Status:</strong>
                </div>
                <ul className="mt-2 text-sm text-blue-700 space-y-1">
                  <li>• ✅ Automatic timer is paused</li>
                  <li>• ✅ Game won't auto-complete at timer end</li>
                  <li>• ✅ Manual result will be used when completing</li>
                  <li>• ✅ Protected from timer interference</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveGameManagement;
