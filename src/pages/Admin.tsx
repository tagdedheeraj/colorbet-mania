import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminAuthService, { AdminUser } from '@/services/adminAuthService';
import DepositRequestService, { DepositRequest, DepositStats } from '@/services/depositRequestService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Users, GamepadIcon, TrendingUp, LogOut, RefreshCw, Edit, ArrowLeft, CreditCard, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import PaymentGatewayConfig from '@/components/admin/PaymentGatewayConfig';
import DepositRequestCard from '@/components/admin/DepositRequestCard';
import DepositRequestStats from '@/components/admin/DepositRequestStats';

// Type for RPC response
interface RpcResponse {
  success: boolean;
  message: string;
  new_balance?: number;
}

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [bets, setBets] = useState<any[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [depositStats, setDepositStats] = useState<DepositStats | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [editBalance, setEditBalance] = useState<{userId: string, balance: string} | null>(null);
  const [manualGameMode, setManualGameMode] = useState(false);
  const [manualResult, setManualResult] = useState<{number: number | '', color: string}>({ number: '', color: '' });
  const [depositRequestsLoading, setDepositRequestsLoading] = useState(false);

  useEffect(() => {
    checkAdminAndLoadData();
    
    // Set up real-time subscription for deposit requests
    const channel = DepositRequestService.subscribeToDepositUpdates(() => {
      console.log('📱 Real-time deposit update received, reloading...');
      loadDepositRequests();
      loadDepositStats();
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const { authenticated, user } = await AdminAuthService.isAuthenticated();
      
      if (!authenticated || !user) {
        toast.error('Admin access required');
        navigate('/admin-login');
        return;
      }

      setAdminUser(user);
      await loadData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast.error('Error checking admin access');
      navigate('/admin-login');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      console.log('Loading admin data...');
      const [usersResult, gamesResult, betsResult] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('games').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('bets').select(`
          *,
          users!inner(username, email),
          games!inner(game_number, status)
        `).order('created_at', { ascending: false }).limit(100)
      ]);

      console.log('Admin data loaded:', {
        users: usersResult.data?.length,
        games: gamesResult.data?.length,
        bets: betsResult.data?.length
      });

      setUsers(usersResult.data || []);
      setGames(gamesResult.data || []);
      setBets(betsResult.data || []);
      
      // Load deposit requests and stats
      await loadDepositRequests();
      await loadDepositStats();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load admin data');
    }
  };

  const loadDepositRequests = async () => {
    try {
      setDepositRequestsLoading(true);
      const requests = await DepositRequestService.loadDepositRequests();
      setDepositRequests(requests);
      console.log('✅ Loaded deposit requests:', requests.length);
    } catch (error) {
      console.error('❌ Error loading deposit requests:', error);
      toast.error('Failed to load deposit requests');
    } finally {
      setDepositRequestsLoading(false);
    }
  };

  const loadDepositStats = async () => {
    try {
      const stats = await DepositRequestService.getDepositStats();
      setDepositStats(stats);
      console.log('✅ Loaded deposit stats:', stats);
    } catch (error) {
      console.error('❌ Error loading deposit stats:', error);
    }
  };

  const handleApproveDeposit = async (requestId: string, notes?: string) => {
    try {
      const result = await DepositRequestService.approveDepositRequest(requestId, notes);
      if (result.success) {
        await loadDepositRequests();
        await loadDepositStats();
        // Reload users to get updated balances
        const usersResult = await supabase.from('users').select('*').order('created_at', { ascending: false });
        setUsers(usersResult.data || []);
      }
    } catch (error) {
      console.error('Error approving deposit:', error);
    }
  };

  const handleRejectDeposit = async (requestId: string, notes: string) => {
    try {
      const result = await DepositRequestService.rejectDepositRequest(requestId, notes);
      if (result.success) {
        await loadDepositRequests();
        await loadDepositStats();
      }
    } catch (error) {
      console.error('Error rejecting deposit:', error);
    }
  };

  const handleUpdateBalance = async () => {
    if (!editBalance) return;

    const newBalance = parseFloat(editBalance.balance);
    if (isNaN(newBalance)) {
      toast.error('Invalid balance amount');
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', editBalance.userId);

      if (error) {
        console.error('❌ Balance update error:', error);
        toast.error('Failed to update balance');
        return;
      }

      toast.success('Balance updated successfully');
      setEditBalance(null);
      loadData();
    } catch (error) {
      console.error('❌ Balance update exception:', error);
      toast.error('Failed to update balance');
    }
  };

  const handleSetManualResult = async () => {
    if (!manualResult.number || !manualResult.color) {
      toast.error('Please set both number and color');
      return;
    }

    try {
      // Find the latest active game
      const { data: activeGame, error } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !activeGame) {
        toast.error('No active game found');
        return;
      }

      // Update the game with manual result
      const { error: updateError } = await supabase
        .from('games')
        .update({
          admin_controlled: true,
          admin_set_result_number: parseInt(manualResult.number.toString()),
          admin_set_result_color: manualResult.color
        })
        .eq('id', activeGame.id);

      if (updateError) {
        console.error('❌ Manual result error:', updateError);
        toast.error('Failed to set manual result');
        return;
      }

      toast.success('Manual result set successfully!');
      setManualResult({ number: '', color: '' });
      loadData();
    } catch (error) {
      console.error('❌ Manual result exception:', error);
      toast.error('Failed to set manual result');
    }
  };

  const handleLogout = async () => {
    await AdminAuthService.logout();
    navigate('/admin-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const totalBalance = users.reduce((sum, user) => sum + (user.balance || 0), 0);
  const totalBetsAmount = bets.reduce((sum, bet) => sum + (bet.amount || 0), 0);
  const pendingDeposits = depositStats?.pending_count || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">
                Welcome, {adminUser?.username} - Manage your gaming platform
              </p>
            </div>
          </div>
          
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <GamepadIcon className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{games.length}</p>
                  <p className="text-sm text-muted-foreground">Total Games</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{bets.length}</p>
                  <p className="text-sm text-muted-foreground">Total Bets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <CreditCard className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{pendingDeposits}</p>
                  <p className="text-sm text-muted-foreground">Pending Deposits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">₹{totalBalance.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="deposits" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="deposits">Deposits ({pendingDeposits})</TabsTrigger>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="games">Games ({games.length})</TabsTrigger>
            <TabsTrigger value="bets">Bets ({bets.length})</TabsTrigger>
            <TabsTrigger value="live-control">Live Control</TabsTrigger>
            <TabsTrigger value="payment-config">Payment Config</TabsTrigger>
          </TabsList>

          <TabsContent value="deposits" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Deposit Requests Management</CardTitle>
                    <CardDescription>Review and approve user deposit requests</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      loadDepositRequests();
                      loadDepositStats();
                    }}
                    disabled={depositRequestsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${depositRequestsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Deposit Stats */}
                <DepositRequestStats stats={depositStats} loading={depositRequestsLoading} />
                
                {/* Deposit Requests */}
                <div className="space-y-4">
                  {depositRequestsLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                      <p>Loading deposit requests...</p>
                    </div>
                  ) : depositRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">No deposit requests found</p>
                      <p className="text-muted-foreground">New deposit requests will appear here automatically</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {depositRequests.map((request) => (
                        <DepositRequestCard
                          key={request.id}
                          request={request}
                          onApprove={handleApproveDeposit}
                          onReject={handleRejectDeposit}
                          loading={depositRequestsLoading}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment-config" className="space-y-4">
            <PaymentGatewayConfig />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and balances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>₹{user.balance}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                              {user.role || 'user'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditBalance({userId: user.id, balance: user.balance.toString()})}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Balance
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="bets" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="live-control" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Live Game Control
                </CardTitle>
                <CardDescription>
                  Control live games and set manual results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Manual Game Mode</h3>
                    <p className="text-sm text-muted-foreground">
                      When enabled, you can set custom results for games
                    </p>
                  </div>
                  <Switch
                    checked={manualGameMode}
                    onCheckedChange={setManualGameMode}
                  />
                </div>

                {manualGameMode && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Set Manual Result</CardTitle>
                      <CardDescription>
                        Set the result for the current active game
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="manualNumber">Number (0-9)</Label>
                          <Input
                            id="manualNumber"
                            type="number"
                            min="0"
                            max="9"
                            value={manualResult.number}
                            onChange={(e) => setManualResult({...manualResult, number: parseInt(e.target.value) || ''})}
                            placeholder="Enter number 0-9"
                          />
                        </div>
                        <div>
                          <Label htmlFor="manualColor">Color</Label>
                          <select
                            id="manualColor"
                            value={manualResult.color}
                            onChange={(e) => setManualResult({...manualResult, color: e.target.value})}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="">Select color</option>
                            <option value="red">Red</option>
                            <option value="green">Green</option>
                            <option value="violet">Violet</option>
                          </select>
                        </div>
                      </div>
                      <Button 
                        onClick={handleSetManualResult}
                        className="w-full"
                        disabled={!manualResult.number || !manualResult.color}
                      >
                        Set Manual Result
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        ⚠️ This will override the automatic result for the current game
                      </p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Balance Modal */}
        {editBalance && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Edit User Balance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="balance">New Balance</Label>
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    value={editBalance.balance}
                    onChange={(e) => setEditBalance({...editBalance, balance: e.target.value})}
                    placeholder="Enter new balance"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdateBalance} className="flex-1">
                    Update Balance
                  </Button>
                  <Button variant="outline" onClick={() => setEditBalance(null)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
