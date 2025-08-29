import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminAuthService, { AdminUser } from '@/services/adminAuthService';
import { AdminService } from '@/services/adminService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Users, 
  Gamepad2,
  TrendingUp, 
  Settings, 
  LogOut, 
  RefreshCw,
  Target,
  DollarSign
} from 'lucide-react';
import AdminStatsCards from '@/components/admin/AdminStatsCards';
import UserManagement from '@/components/admin/UserManagement';
import GameManagement from '@/components/admin/GameManagement';
import BettingAnalytics from '@/components/admin/BettingAnalytics';
import LiveGameManagement from '@/components/admin/LiveGameManagement';
import DepositManagement from '@/components/admin/DepositManagement';
import PaymentGatewayConfig from '@/components/admin/PaymentGatewayConfig';
import AdminSettings from '@/components/admin/AdminSettings';
import { SimpleManualGameService } from '@/services/admin/simpleManualGameService';

// Create compatible types for components
interface CompatibleUser {
  id: string;
  email: string;
  username: string;
  role: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

interface CompatibleBet {
  id: string;
  user_id: string;
  period_number: number;
  bet_type: 'color' | 'number';
  bet_value: string;
  amount: number;
  profit: number;
  status: string;
  created_at: string;
  profiles?: { username: string; email: string };
  is_winner: boolean;
  actual_win: number;
}

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [bets, setBets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Loading states for each section
  const [usersLoading, setUsersLoading] = useState(false);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [betsLoading, setBetsLoading] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      console.log('🔍 Checking admin authentication...');
      const { authenticated, user } = await AdminAuthService.isAuthenticated();
      
      if (authenticated && user) {
        console.log('✅ Admin authenticated:', user.email);
        setIsAuthenticated(true);
        setCurrentUser(user);
        await loadData();
      } else {
        console.log('❌ Admin not authenticated, redirecting to login');
        navigate('/admin-login');
      }
    } catch (error) {
      console.error('❌ Authentication check failed:', error);
      navigate('/admin-login');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    console.log('📊 Loading admin data...');
    await Promise.all([
      loadUsers(),
      loadGames(),
      loadBets()
    ]);
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      console.log('👥 Loading users...');
      const { data, error } = await AdminService.getAllUsers();
      
      if (error) {
        console.error('❌ Error loading users:', error);
        toast.error('Failed to load users');
      } else {
        console.log('✅ Users loaded:', data.length);
        // Ensure users have required properties for AdminUser type
        const adminUsers: AdminUser[] = data.map(user => ({
          id: user.id,
          email: user.email || '',
          username: user.username || '',
          role: user.role || 'user',
          balance: user.balance || 0,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || new Date().toISOString()
        }));
        setUsers(adminUsers);
      }
    } catch (error) {
      console.error('❌ Exception loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadGames = async () => {
    try {
      setGamesLoading(true);
      console.log('🎮 Loading games...');
      const { data, error } = await AdminService.getAllGames();
      
      if (error) {
        console.error('❌ Error loading games:', error);
        toast.error('Failed to load games');
      } else {
        console.log('✅ Games loaded:', data.length);
        setGames(data);
      }
    } catch (error) {
      console.error('❌ Exception loading games:', error);
      toast.error('Failed to load games');
    } finally {
      setGamesLoading(false);
    }
  };

  const loadBets = async () => {
    try {
      setBetsLoading(true);
      console.log('🎯 Loading bets...');
      const { data, error } = await AdminService.getAllBets();
      
      if (error) {
        console.error('❌ Error loading bets:', error);
        toast.error('Failed to load bets');
      } else {
        console.log('✅ Bets loaded:', data.length);
        setBets(data);
      }
    } catch (error) {
      console.error('❌ Exception loading bets:', error);
      toast.error('Failed to load bets');
    } finally {
      setBetsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Admin logging out...');
      await AdminAuthService.logout();
      navigate('/admin-login');
    } catch (error) {
      console.error('❌ Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const handleUpdateBalance = async (userId: string, newBalance: number) => {
    try {
      console.log('💰 Updating balance for user:', userId, 'to:', newBalance);
      const { success } = await AdminService.updateUserBalance(userId, newBalance);
      
      if (success) {
        toast.success('Balance updated successfully');
        await loadUsers();
      }
    } catch (error) {
      console.error('❌ Balance update error:', error);
      toast.error('Failed to update balance');
    }
  };

  const handleSetManualResult = async (number: number) => {
    try {
      console.log('🎯 Setting manual result:', number);
      
      // Find the active game
      const activeGame = games.find(game => game.status === 'active');
      if (!activeGame) {
        toast.error('No active game found', {
          description: 'There must be an active game to set manual results'
        });
        return;
      }

      console.log('🎮 Found active game:', activeGame.game_number);

      // Use the SimpleManualGameService to set manual result
      const success = await SimpleManualGameService.setManualResult(activeGame.id, number);

      if (success) {
        toast.success(`Manual result set to ${number} successfully!`, {
          description: `Game ${activeGame.game_number} result has been set`
        });
        
        // Reload game data
        await loadGames();
      } else {
        toast.error('Failed to set manual result', {
          description: 'Please check the console for more details'
        });
      }
    } catch (error) {
      console.error('❌ Error setting manual result:', error);
      toast.error('Error setting manual result', {
        description: 'An unexpected error occurred'
      });
    }
  };

  const handleRefreshData = async () => {
    console.log('🔄 Refreshing admin data...');
    setLoading(true);
    await loadData();
    setLoading(false);
    toast.success('Admin data refreshed successfully');
  };

  // Create compatible data for components
  const compatibleUsers: CompatibleUser[] = users.map(user => ({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    balance: user.balance,
    created_at: user.created_at,
    updated_at: user.updated_at
  }));

  const compatibleBets: CompatibleBet[] = bets.map(bet => ({
    ...bet,
    is_winner: bet.is_winner || false,
    actual_win: bet.actual_win || bet.profit || 0
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  const statsData = {
    totalUsers: users.length,
    totalGames: games.length,
    totalBets: bets.length,
    totalRevenue: bets.reduce((sum, bet) => sum + (bet.amount || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <div className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                    Admin Dashboard
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Welcome back, {currentUser?.username || 'Admin'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-fit">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="games" className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              Games
            </TabsTrigger>
            <TabsTrigger value="bets" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Bets
            </TabsTrigger>
            <TabsTrigger value="live-control" className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              Live Control  
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsData.totalUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Games</CardTitle>
                  <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsData.totalGames}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bets</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsData.totalBets}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{statsData.totalRevenue.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest system activity overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-blue-500" />
                        <span className="font-medium">Total Users</span>
                      </div>
                      <span className="text-lg font-bold">{statsData.totalUsers}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Target className="w-5 h-5 text-green-500" />
                        <span className="font-medium">Active Bets</span>
                      </div>
                      <span className="text-lg font-bold">{bets.filter(bet => bet.status === 'pending').length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="w-5 h-5 text-purple-500" />
                        <span className="font-medium">Total Revenue</span>
                      </div>
                      <span className="text-lg font-bold">₹{statsData.totalRevenue.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => setActiveTab('users')} 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Manage Users
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('live-control')} 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Gamepad2 className="w-4 h-4 mr-2" />
                    Live Game Control
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('settings')} 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    System Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement 
              users={compatibleUsers} 
              onUpdateBalance={handleUpdateBalance}
              loading={usersLoading}
              onRefresh={loadUsers}
            />
          </TabsContent>

          <TabsContent value="games" className="space-y-4">
            <GameManagement games={games} />
          </TabsContent>

          <TabsContent value="bets" className="space-y-4">
            <BettingAnalytics bets={compatibleBets} />
          </TabsContent>

          <TabsContent value="live-control" className="space-y-4">
            <LiveGameManagement />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Deposit Management</CardTitle>
                  <CardDescription>Manage user deposit requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Deposit management features will be available here.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Payment Gateway</CardTitle>
                  <CardDescription>Configure payment gateways</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Payment gateway configuration will be available here.</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
                <CardDescription>System administration settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Admin settings will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
