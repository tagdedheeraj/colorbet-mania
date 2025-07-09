
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LiveBettingAnalyticsService, LiveBettingAnalytics } from '@/services/admin/liveBettingAnalyticsService';
import { RefreshCw, Users, Target, DollarSign, TrendingUp, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface DetailedBettingAnalyticsProps {
  gameId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const DetailedBettingAnalytics: React.FC<DetailedBettingAnalyticsProps> = ({
  gameId,
  autoRefresh = true,
  refreshInterval = 5000
}) => {
  const [analytics, setAnalytics] = useState<LiveBettingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailedBets, setShowDetailedBets] = useState(false);

  useEffect(() => {
    if (gameId) {
      loadAnalytics();
      
      if (autoRefresh) {
        const interval = setInterval(loadAnalytics, refreshInterval);
        return () => clearInterval(interval);
      }
    }
  }, [gameId, autoRefresh, refreshInterval]);

  const loadAnalytics = async () => {
    if (!gameId) return;
    
    try {
      console.log('📊 Loading detailed betting analytics for game:', gameId);
      const data = await LiveBettingAnalyticsService.getLiveBettingAnalytics(gameId);
      setAnalytics(data);
    } catch (error) {
      console.error('❌ Error loading analytics:', error);
      toast.error('Failed to load betting analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadAnalytics();
  };

  if (!gameId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detailed Betting Analytics</CardTitle>
          <CardDescription>No active game found</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading && !analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detailed Betting Analytics</CardTitle>
          <CardDescription>Loading betting data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detailed Betting Analytics</CardTitle>
          <CardDescription>No betting data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniquePlayers}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.uniquePlayers === 0 ? 'No players yet' : 'players betting'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bets</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalBets}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalBets === 0 ? 'No bets placed' : 'bets placed'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analytics.totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalAmount === 0 ? 'No betting amount' : 'total wagered'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Game #{analytics.gameNumber}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Number-wise Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Number-wise Betting Breakdown</CardTitle>
          <CardDescription>
            {analytics.totalBets === 0 
              ? 'No bets placed yet - breakdown will appear when players start betting'
              : 'Live betting distribution across numbers (0-9)'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.totalBets === 0 ? (
            <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg">
              <Target className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">No Betting Activity</p>
                <p className="text-xs text-muted-foreground/70">Number breakdown will show when players place bets</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {analytics.numberBreakdown.map(numberData => (
                <div 
                  key={numberData.number} 
                  className={`p-4 border-2 rounded-lg ${
                    numberData.color === 'red' ? 'border-red-200 bg-red-50' :
                    numberData.color === 'green' ? 'border-green-200 bg-green-50' :
                    'border-purple-200 bg-purple-50'
                  }`}
                >
                  <div className="text-center">
                    <span className={`text-3xl font-bold ${
                      numberData.color === 'red' ? 'text-red-600' :
                      numberData.color === 'green' ? 'text-green-600' :
                      'text-purple-600'
                    }`}>
                      {numberData.number}
                    </span>
                    <div className="mt-2 space-y-1">
                      <div className="text-sm font-semibold">{numberData.count} bets</div>
                      <div className="text-xs text-muted-foreground">₹{numberData.amount.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{numberData.users} users</div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          numberData.color === 'red' ? 'border-red-300 text-red-700' :
                          numberData.color === 'green' ? 'border-green-300 text-green-700' :
                          'border-purple-300 text-purple-700'
                        }`}
                      >
                        {numberData.color === 'purple-red' ? 'Purple-Red' : numberData.color}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Bets Table */}
      {analytics.detailedBets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Individual Bets ({analytics.detailedBets.length})</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetailedBets(!showDetailedBets)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDetailedBets ? 'Hide' : 'Show'} Details
              </Button>
            </CardTitle>
            <CardDescription>
              Individual betting details for Game #{analytics.gameNumber}
            </CardDescription>
          </CardHeader>
          {showDetailedBets && (
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Bet Type</TableHead>
                      <TableHead>Number</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Potential Win</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.detailedBets.map((bet) => (
                      <TableRow key={bet.bet_id}>
                        <TableCell font-medium>{bet.username}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {bet.bet_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`${
                              LiveBettingAnalyticsService.getColorForNumber(parseInt(bet.bet_value)) === 'red' ? 'bg-red-100 text-red-800' :
                              LiveBettingAnalyticsService.getColorForNumber(parseInt(bet.bet_value)) === 'green' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {bet.bet_value}
                          </Badge>
                        </TableCell>
                        <TableCell>₹{Number(bet.amount).toFixed(2)}</TableCell>
                        <TableCell>₹{Number(bet.potential_win).toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(bet.created_at).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};

export default DetailedBettingAnalytics;
