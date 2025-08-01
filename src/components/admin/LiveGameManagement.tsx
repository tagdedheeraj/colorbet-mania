
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users, Target, DollarSign, Clock, RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { AdminGameService, LiveGameStats } from '@/services/adminGameService';
import DetailedBettingAnalytics from './DetailedBettingAnalytics';
import EnhancedManualGameControl from './EnhancedManualGameControl';

const LiveGameManagement: React.FC = () => {
  const [gameStats, setGameStats] = useState<LiveGameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    loadGameStats();
    const interval = setInterval(loadGameStats, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadGameStats = async () => {
    try {
      console.log('📊 Loading enhanced game stats...');
      const stats = await AdminGameService.getCurrentGameStats();
      console.log('✅ Enhanced game stats loaded:', stats);
      setGameStats(stats);
      setLastError(null);
    } catch (error) {
      console.error('❌ Error loading enhanced game stats:', error);
      setLastError('Failed to load game statistics');
      if (loading) {
        toast.error('Failed to load game statistics');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleControlStatusChange = () => {
    console.log('🔄 Manual control status changed, refreshing stats');
    setTimeout(loadGameStats, 1000); // Refresh after 1 second
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading enhanced game data...</span>
      </div>
    );
  }

  if (!gameStats?.activeGame) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Enhanced Live Game Management
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
      {/* Error Display */}
      {lastError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Error: {lastError}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gameStats.activePlayers}</div>
            <p className="text-xs text-muted-foreground">
              Currently betting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bets</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gameStats.totalBets}</div>
            <p className="text-xs text-muted-foreground">
              Placed this round
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bet Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{gameStats.totalBetAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total wagered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Game Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={gameStats.activeGame.status === 'active' ? 'default' : 'secondary'}>
                {gameStats.activeGame.status}
              </Badge>
              <Badge variant={gameStats.activeGame.game_mode_type === 'manual' ? 'destructive' : 'secondary'}>
                {gameStats.activeGame.game_mode_type || 'auto'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Game #{gameStats.activeGame.game_number}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Manual Game Control */}
      <EnhancedManualGameControl
        gameId={gameStats.activeGame.id}
        gameNumber={gameStats.activeGame.game_number}
        onStatusChange={handleControlStatusChange}
      />

      {/* Detailed Betting Analytics */}
      <DetailedBettingAnalytics 
        gameId={gameStats.activeGame.id}
        autoRefresh={true}
        refreshInterval={5000}
      />
    </div>
  );
};

export default LiveGameManagement;
