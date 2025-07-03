import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminService } from '@/services/adminService';
import { AdminAuthService } from '@/services/adminAuthService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users, GamepadIcon, DollarSign, Activity, Settings, LogOut, ArrowLeft } from 'lucide-react';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [bets, setBets] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [adminInfo, setAdminInfo] = useState<any>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const isValidSession = await AdminAuthService.verifySession();
      
      if (!isValidSession) {
        toast.error('Access denied. Please login as admin.');
        navigate('/admin-login');
        return;
      }

      const adminData = AdminAuthService.getAdminInfo();
      setAdminInfo(adminData);
      
      await loadAdminData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/admin-login');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const [usersResult, gamesResult, betsResult] = await Promise.all([
        AdminService.getAllUsers(),
        AdminService.getAllGames(),
        AdminService.getAllBets()
      ]);

      setUsers(usersResult.data);
      setGames(gamesResult.data);
      setBets(betsResult.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    }
  };

  const handleUpdateBalance = async () => {
    if (!selectedUserId || !newBalance) {
      toast.error('Please select a user and enter a balance');
      return;
    }

    try {
      const balance = parseFloat(newBalance);
      const { error } = await AdminService.updateUserBalance(selectedUserId, balance);
      
      if (error) {
        toast.error('Failed to update balance');
        return;
      }

      await AdminService.logAdminAction(
        'update_balance',
        'user',
        selectedUserId,
        { old_balance: users.find(u => u.id === selectedUserId)?.balance, new_balance: balance }
      );

      toast.success('Balance updated successfully');
      setSelectedUserId('');
      setNewBalance('');
      await loadAdminData();
    } catch (error) {
      console.error('Error updating balance:', error);
      toast.error('Failed to update balance');
    }
  };

  const handleLogout = async () => {
    try {
      await AdminAuthService.logout();
      toast.success('Admin logged out successfully');
      navigate('/admin-login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking admin access...</p>
        </div>
      </div>
    );
  }

  const totalUsers = users.length;
  const totalGames = games.length;
  const totalBets = bets.length;
  const totalVolume = bets.reduce((sum, bet) => sum + bet.amount, 0);

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
                Welcome, {adminInfo?.username} - Manage your gaming platform
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Games</CardTitle>
              <GamepadIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalGames}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bets</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBets}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVolume.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="bets">Bets</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and balances</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Balance Update Section */}
                <div className="mb-6 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Update User Balance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="user-select">Select User</Label>
                      <select
                        id="user-select"
                        className="w-full p-2 border rounded"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                      >
                        <option value="">Select a user...</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.username} ({user.email}) - {user.balance} coins
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="new-balance">New Balance</Label>
                      <Input
                        id="new-balance"
                        type="number"
                        value={newBalance}
                        onChange={(e) => setNewBalance(e.target.value)}
                        placeholder="Enter new balance"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleUpdateBalance}>Update Balance</Button>
                    </div>
                  </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">Username</th>
                        <th className="border border-gray-300 p-2 text-left">Email</th>
                        <th className="border border-gray-300 p-2 text-left">Balance</th>
                        <th className="border border-gray-300 p-2 text-left">Role</th>
                        <th className="border border-gray-300 p-2 text-left">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id}>
                          <td className="border border-gray-300 p-2">{user.username}</td>
                          <td className="border border-gray-300 p-2">{user.email}</td>
                          <td className="border border-gray-300 p-2">{user.balance} coins</td>
                          <td className="border border-gray-300 p-2">
                            <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="border border-gray-300 p-2">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
          </TabsContent>

          <TabsContent value="bets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Betting Analytics</CardTitle>
                <CardDescription>View all betting activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">User</th>
                        <th className="border border-gray-300 p-2 text-left">Game #</th>
                        <th className="border border-gray-300 p-2 text-left">Bet</th>
                        <th className="border border-gray-300 p-2 text-left">Amount</th>
                        <th className="border border-gray-300 p-2 text-left">Result</th>
                        <th className="border border-gray-300 p-2 text-left">Win Amount</th>
                        <th className="border border-gray-300 p-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bets.map(bet => (
                        <tr key={bet.id}>
                          <td className="border border-gray-300 p-2">{bet.users?.username}</td>
                          <td className="border border-gray-300 p-2">{bet.games?.game_number}</td>
                          <td className="border border-gray-300 p-2">
                            {bet.bet_type === 'color' ? bet.bet_value : `Number ${bet.bet_value}`}
                          </td>
                          <td className="border border-gray-300 p-2">{bet.amount}</td>
                          <td className="border border-gray-300 p-2">
                            <Badge variant={bet.is_winner ? 'default' : 'destructive'}>
                              {bet.is_winner ? 'Win' : 'Loss'}
                            </Badge>
                          </td>
                          <td className="border border-gray-300 p-2">
                            {bet.actual_win || 0}
                          </td>
                          <td className="border border-gray-300 p-2">
                            {new Date(bet.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure platform settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Admin Information</h3>
                    <p className="text-muted-foreground">
                      Logged in as: <strong>{adminInfo?.username}</strong> ({adminInfo?.email})
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Game Settings</h3>
                    <p className="text-muted-foreground">Game mode configurations and payout rates can be adjusted in the game modes config.</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">User Management</h3>
                    <p className="text-muted-foreground">User registration settings and default balance configurations.</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Platform Status</h3>
                    <p className="text-muted-foreground">System is running normally. All services are operational.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
