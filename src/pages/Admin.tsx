
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminService } from '@/services/adminService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Users, GamepadIcon, TrendingUp, LogOut, RefreshCw, Edit } from 'lucide-react';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [bets, setBets] = useState<any[]>([]);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [editBalance, setEditBalance] = useState<{userId: string, balance: string} | null>(null);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const isAdmin = await AdminService.isAdmin();
      
      if (!isAdmin) {
        toast.error('Admin access required');
        navigate('/admin-login');
        return;
      }

      const adminData = await AdminService.getAdminInfo();
      setAdminInfo(adminData);
      
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
      const [usersResult, gamesResult, betsResult] = await Promise.all([
        AdminService.getAllUsers(),
        AdminService.getAllGames(),
        AdminService.getAllBets()
      ]);

      setUsers(usersResult.data || []);
      setGames(gamesResult.data || []);
      setBets(betsResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load admin data');
    }
  };

  const handleUpdateBalance = async () => {
    if (!editBalance) return;

    const newBalance = parseFloat(editBalance.balance);
    if (isNaN(newBalance)) {
      toast.error('Invalid balance amount');
      return;
    }

    const result = await AdminService.updateUserBalance(editBalance.userId, newBalance);
    
    if (result.success) {
      setEditBalance(null);
      loadData(); // Reload data to show updated balance
    }
  };

  const handleLogout = () => {
    AdminService.logout();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">TradeForWin Admin</h1>
            <p className="text-muted-foreground">
              Welcome back, {adminInfo?.username || 'Admin'}
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="games">Games ({games.length})</TabsTrigger>
            <TabsTrigger value="bets">Bets ({bets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and balances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-sm">Balance: ₹{user.balance}</p>
                        <p className="text-sm text-muted-foreground">Role: {user.role}</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setEditBalance({userId: user.id, balance: user.balance.toString()})}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Balance
                      </Button>
                    </div>
                  ))}
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
