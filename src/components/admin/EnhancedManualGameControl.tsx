
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Settings, AlertTriangle, CheckCircle, Pause, Timer, Target, RefreshCw } from 'lucide-react';
import { EnhancedManualGameService } from '@/services/admin/enhancedManualGameService';

interface EnhancedManualGameControlProps {
  gameId: string;
  gameNumber: number;
  onStatusChange?: () => void;
}

const EnhancedManualGameControl: React.FC<EnhancedManualGameControlProps> = ({ 
  gameId, 
  gameNumber, 
  onStatusChange 
}) => {
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [resultSet, setResultSet] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  useEffect(() => {
    loadGameStatus();
  }, [gameId]);

  const loadGameStatus = async () => {
    try {
      console.log('🔄 Loading game status for:', gameId);
      const status = await EnhancedManualGameService.checkGameStatus(gameId);
      
      if (status.error) {
        setLastError(status.error);
        toast.error(`Status check failed: ${status.error}`);
        return;
      }

      setIsManualMode(status.isManual);
      setTimerPaused(status.timerPaused);
      setResultSet(status.resultSet);
      setLastError(null);
      
      console.log('✅ Game status loaded:', status);
    } catch (error) {
      console.error('❌ Error loading game status:', error);
      setLastError('Failed to load game status');
    }
  };

  const handleModeChange = async (manual: boolean) => {
    setIsLoading(true);
    setLastError(null);
    
    try {
      console.log(`🔄 Changing mode to ${manual ? 'manual' : 'automatic'}`);
      
      const result = await EnhancedManualGameService.setManualMode(gameId, manual);
      
      if (result.success) {
        setIsManualMode(manual);
        setTimerPaused(manual);
        
        toast.success(result.message, {
          description: manual ? 'Timer is now paused' : 'Timer is now active',
          icon: manual ? <Pause className="h-4 w-4" /> : <Timer className="h-4 w-4" />
        });
        
        onStatusChange?.();
      } else {
        setLastError(result.message);
        toast.error('Mode Change Failed', {
          description: result.message,
          icon: <AlertTriangle className="h-4 w-4" />
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setLastError(errorMsg);
      toast.error('System Error', { description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetResult = async () => {
    if (selectedNumber === null) {
      toast.error('Please select a number (0-9)');
      return;
    }

    setIsLoading(true);
    setLastError(null);
    
    try {
      console.log(`🎯 Setting result to: ${selectedNumber}`);
      
      const result = await EnhancedManualGameService.setManualResult(gameId, selectedNumber);
      
      if (result.success) {
        setResultSet(true);
        
        toast.success('Result Set Successfully!', {
          description: `Game #${gameNumber} result set to ${selectedNumber}`,
          icon: <CheckCircle className="h-4 w-4" />
        });
        
        onStatusChange?.();
      } else {
        setLastError(result.message);
        toast.error('Failed to Set Result', {
          description: result.message,
          icon: <AlertTriangle className="h-4 w-4" />
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setLastError(errorMsg);
      toast.error('System Error', { description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteGame = async () => {
    if (!resultSet) {
      toast.error('Please set a result before completing the game');
      return;
    }

    setIsLoading(true);
    setLastError(null);
    
    try {
      console.log('🏁 Completing game manually');
      
      const result = await EnhancedManualGameService.completeGameManually(gameId);
      
      if (result.success) {
        toast.success('Game Completed!', {
          description: `Game #${gameNumber} completed successfully`,
          icon: <CheckCircle className="h-4 w-4" />
        });
        
        onStatusChange?.();
      } else {
        setLastError(result.message);
        toast.error('Failed to Complete Game', {
          description: result.message,
          icon: <AlertTriangle className="h-4 w-4" />
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setLastError(errorMsg);
      toast.error('System Error', { description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const getColorForNumber = (num: number): string => {
    if ([1, 3, 7, 9].includes(num)) return 'red';
    if ([2, 4, 6, 8].includes(num)) return 'green';
    if ([0, 5].includes(num)) return 'purple-red';
    return 'red';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Enhanced Manual Game Control - Game #{gameNumber}
          </div>
          <Button onClick={loadGameStatus} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          <div className="flex flex-wrap items-center gap-2">
            <span>Mode:</span>
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
            {resultSet && (
              <>
                <span>| Status:</span>
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Result Set
                </Badge>
              </>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Error Display */}
        {lastError && (
          <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Error: {lastError}</span>
            </div>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex items-center space-x-3 p-4 border rounded-lg">
          <Switch
            id="manual-mode"
            checked={isManualMode}
            onCheckedChange={handleModeChange}
            disabled={isLoading}
          />
          <div className="flex-1">
            <Label htmlFor="manual-mode" className="text-base font-medium">
              Manual Mode {isManualMode ? '(ON)' : '(OFF)'}
            </Label>
            <p className="text-sm text-muted-foreground">
              {isManualMode 
                ? 'Timer is paused, set result manually' 
                : 'Automatic mode with timer'
              }
            </p>
          </div>
        </div>

        {/* Manual Controls */}
        {isManualMode && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Set Manual Result</h3>
            </div>
            
            {/* Number Selection Grid */}
            <div>
              <Label className="text-base font-medium">Select Number (0-9):</Label>
              <div className="grid grid-cols-5 gap-2 mt-3">
                {numbers.map(num => (
                  <Button
                    key={num}
                    variant={selectedNumber === num ? 'default' : 'outline'}
                    onClick={() => setSelectedNumber(num)}
                    disabled={isLoading}
                    className="h-12 text-lg font-bold"
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>

            {/* Direct Input */}
            <div>
              <Label htmlFor="number-input">Or enter directly:</Label>
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
                className="w-32 mt-2"
                placeholder="0-9"
                disabled={isLoading}
              />
            </div>

            {/* Color Preview */}
            {selectedNumber !== null && (
              <div className="p-3 bg-primary/10 rounded border">
                <div className="flex items-center gap-2">
                  <strong>Selected:</strong> 
                  <span className="text-2xl font-bold">{selectedNumber}</span>
                  <span className={`px-3 py-1 rounded text-white font-medium ${
                    getColorForNumber(selectedNumber) === 'red' ? 'bg-red-500' :
                    getColorForNumber(selectedNumber) === 'green' ? 'bg-green-500' :
                    'bg-purple-500'
                  }`}>
                    {getColorForNumber(selectedNumber) === 'purple-red' ? 'Purple-Red' : getColorForNumber(selectedNumber)}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleSetResult} 
                disabled={selectedNumber === null || isLoading}
                className="flex-1"
              >
                <Target className="h-4 w-4 mr-2" />
                {isLoading ? 'Setting...' : 'Set Result'}
              </Button>
              
              <Button 
                onClick={handleCompleteGame} 
                variant="destructive" 
                disabled={isLoading || !resultSet}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isLoading ? 'Completing...' : 'Complete Game'}
              </Button>
            </div>

            {/* Status Info */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center gap-2 text-blue-800 mb-2">
                <Settings className="h-4 w-4" />
                <strong>Manual Mode Active</strong>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• ✅ Timer is paused automatically</li>
                <li>• ✅ Game won't auto-complete</li>
                <li>• ✅ Manual result will be used</li>
                <li>• ✅ Admin has full control</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedManualGameControl;
