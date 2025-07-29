
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminAuthService, { AdminUser } from '@/services/adminAuthService';
import DepositRequestService, { DepositRequest, DepositStats } from '@/services/depositRequestService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Import new components
import AdminHeader from '@/components/admin/AdminHeader';
import AdminStatsCards from '@/components/admin/AdminStatsCards';
import DepositManagement from '@/components/admin/DepositManagement';
import UserManagement from '@/components/admin/UserManagement';
import GameManagement from '@/components/admin/GameManagement';
import BettingAnalytics from '@/components/admin/BettingAnalytics';
import LiveGameControl from '@/components/admin/LiveGameControl';
import LiveGameManagement from '@/components/admin/LiveGameManagement';
import PaymentGatewayConfig from '@/components/admin/PaymentGatewayConfig';
import AdminSettings from '@/components/admin/AdminSettings';
import { ManualGameService } from '@/services/admin/manualGameService';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [bets, setBets] = useState<any[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [depositStats, setDepositStats] = useState<DepositStats | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [depositRequestsLoading, setDepositRequestsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndLoadData();
    
    // Set up real-time subscription for deposit requests
    const depositChannel = DepositRequestService.subscribeToDepositUpdates(() => {
      console.log('📱 Real-time deposit update received, reloading...');
      loadDepositRequests();
      loadDepositStats();
    });

    // Set up real-time subscription for users table
    const usersChannel = supabase
      .channel('admin-users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          console.log('👥 Real-time user change received:', payload);
          loadUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(depositChannel);
      supabase.removeChannel(usersChannel);
    };
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      console.log('🔐 Checking admin authentication...');
      const { authenticated, user } = await AdminAuthService.isAuthenticated();
      
      if (!authenticated || !user) {
        console.error('❌ Admin authentication failed');
        toast.error('Admin access required');
        navigate('/admin-login');
        return;
      }

      console.log('✅ Admin authenticated:', user.username);
      setAdminUser(user);
      await loadData();
    } catch (error) {
      console.error('❌ Error checking admin access:', error);
      setDataError('Error checking admin access');
      toast.error('Error checking admin access');
      navigate('/admin-login');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      console.log('📊 Loading admin data...');
      setDataError(null);
      
      const [gamesResult, betsResult] = await Promise.all([
        supabase.from('games').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('bets').select(`
          *,
          users!inner(username, email),
          games!inner(game_number, status)
        `).order('created_at', { ascending: false }).limit(100)
      ]);

      console.log('📊 Admin data loaded:', {
        games: gamesResult.data?.length,
        bets: betsResult.data?.length
      });

      setGames(gamesResult.data || []);
      setBets(betsResult.data || []);
      
      // Load users separately with better error handling
      await loadUsers();
      
      // Load deposit requests and stats
      await loadDepositRequests();
      await loadDepositStats();
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setDataError('Failed to load admin data');
      toast.error('Failed to load admin data');
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      setDataError(null);
      console.log('👥 Loading users...');
      
      const { data: usersResult, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Users loading error:', error);
        throw error;
      }

      console.log('✅ Users loaded successfully:', usersResult?.length || 0, 'users');
      setUsers(usersResult || []);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      setDataError('Failed to load users');
      toast.error('Failed to load users');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadDepositRequests = async () => {
    try {
      setDepositRequestsLoading(true);
      console.log('💰 Loading deposit requests...');
      const requests = await DepositRequestService.loadDepositRequests();
      setDepositRequests(requests);
      console.log('✅ Deposit requests loaded:', requests.length, 'total requests');
      console.log('📋 Pending requests:', requests.filter(r => r.status === 'pending').length);
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
      console.log('✅ Deposit stats loaded:', stats);
    } catch (error) {
      console.error('❌ Error loading deposit stats:', error);
    }
  };

  const handleApproveDeposit = async (requestId: string, notes?: string) => {
    try {
      console.log('🟢 Handling approve deposit:', requestId);
      const result = await DepositRequestService.approveDepositRequest(requestId, notes);
      if (result.success) {
        console.log('✅ Deposit approved, reloading data...');
        await loadDepositRequests();
        await loadDepositStats();
        // Reload users to get updated balances
        await loadUsers();
      }
    } catch (error) {
      console.error('❌ Error approving deposit:', error);
    }
  };

  const handleRejectDeposit = async (requestId: string, notes: string) => {
    try {
      console.log('🔴 Handling reject deposit:', requestId);
      const result = await DepositRequestService.rejectDepositRequest(requestId, notes);
      if (result.success) {
        console.log('✅ Deposit rejected, reloading data...');
        await loadDepositRequests();
        await loadDepositStats();
      }
    } catch (error) {
      console.error('❌ Error rejecting deposit:', error);
    }
  };

  const handleUpdateBalance = async (userId: string, newBalance: number) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (error) {
        console.error('❌ Balance update error:', error);
        toast.error('Failed to update balance');
        return;
      }

      toast.success('Balance updated successfully');
      await loadUsers();
    } catch (error) {
      console.error('❌ Balance update exception:', error);
      toast.error('Failed to update balance');
    }
  };

  const handleSetManualResult = async (number: number) => {
    try {
      console.log('🎯 Setting manual result:', number);
      
      // Find the latest active game
      const { data: activeGame, error } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !activeGame) {
        console.error('❌ No active game found:', error);
        toast.error('No active game found');
        return;
      }

      console.log('🎮 Found active game:', activeGame.game_number);

      // Use the ManualGameService to set manual result
      const success = await ManualGameService.setManualResult(activeGame.id, number);

      if (success) {
        toast.success(`Manual result set to ${number} successfully!`, {
          description: `Game #${activeGame.game_number} result has been set`
        });
        await loadData();
      } else {
        toast.error('Failed to set manual result', {
          description: 'Please check console logs for detailed information'
        });
      }
    } catch (error) {
      console.error('❌ Manual result exception:', error);
      toast.error('Failed to set manual result');
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out admin...');
      await AdminAuthService.logout();
      toast.success('Logged out successfully');
      // Force page reload to ensure clean state
      window.location.href = '/admin-login';
    } catch (error) {
      console.error('❌ Logout error:', error);
      navigate('/admin-login');
    }
  };

  const handleManualRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    toast.info('Refreshing admin data...');
    await loadData();
    toast.success('Admin data refreshed successfully');
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
  const pendingDeposits = depositStats?.pending_count || 0;

  console.log('🎛️ Admin render:', {
    users: users.length,
    depositRequests: depositRequests.length,
    pendingDeposits,
    loading: depositRequestsLoading,
    usersLoading,
    dataError,
    adminUser: adminUser?.email
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
      <div className="container mx-auto max-w-7xl">
        <AdminHeader adminUser={adminUser} onLogout={handleLogout} onRefresh={handleManualRefresh} />

        {dataError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">Error: {dataError}</p>
            <button 
              onClick={handleManualRefresh}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        <AdminStatsCards
          usersCount={users.length}
          gamesCount={games.length}
          betsCount={bets.length}
          pendingDeposits={pendingDeposits}
          totalBalance={totalBalance}
        />

        <Tabs defaultValue="deposits" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="deposits">
              Deposits ({pendingDeposits})
            </TabsTrigger>
            <TabsTrigger value="users">
              Users ({users.length}) {usersLoading && <RefreshCw className="h-3 w-3 ml-1 animate-spin" />}
            </TabsTrigger>
            <TabsTrigger value="games">Games ({games.length})</TabsTrigger>
            <TabsTrigger value="bets">Bets ({bets.length})</TabsTrigger>
            <TabsTrigger value="live-control">Live Control</TabsTrigger>
            <TabsTrigger value="payment-config">Payment Config</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="deposits" className="space-y-4">
            <DepositManagement
              depositRequests={depositRequests}
              depositStats={depositStats}
              loading={depositRequestsLoading}
              onRefresh={() => {
                loadDepositRequests();
                loadDepositStats();
              }}
              onApprove={handleApproveDeposit}
              onReject={handleRejectDeposit}
            />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement 
              users={users} 
              onUpdateBalance={handleUpdateBalance}
              loading={usersLoading}
              onRefresh={loadUsers}
            />
          </TabsContent>

          <TabsContent value="games" className="space-y-4">
            <GameManagement games={games} />
          </TabsContent>

          <TabsContent value="bets" className="space-y-4">
            <BettingAnalytics bets={bets} />
          </TabsContent>

          <TabsContent value="live-control" className="space-y-4">
            <LiveGameManagement />
            <LiveGameControl onSetManualResult={handleSetManualResult} />
          </TabsContent>

          <TabsContent value="payment-config" className="space-y-4">
            <PaymentGatewayConfig />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <AdminSettings adminUser={adminUser} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
