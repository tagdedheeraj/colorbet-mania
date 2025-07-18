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
      toast.error('Error checking admin access');
      navigate('/admin-login');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      console.log('📊 Loading admin data...');
      const [usersResult, gamesResult, betsResult] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('games').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('bets').select(`
          *,
          users!inner(username, email),
          games!inner(game_number, status)
        `).order('created_at', { ascending: false }).limit(100)
      ]);

      console.log('📊 Admin data loaded:', {
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
      console.error('❌ Error loading data:', error);
      toast.error('Failed to load admin data');
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
        const usersResult = await supabase.from('users').select('*').order('created_at', { ascending: false });
        setUsers(usersResult.data || []);
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
      loadData();
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
        loadData();
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
    depositRequests: depositRequests.length,
    pendingDeposits,
    loading: depositRequestsLoading,
    adminUser: adminUser?.email
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
      <div className="container mx-auto max-w-7xl">
        <AdminHeader adminUser={adminUser} onLogout={handleLogout} />

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
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
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
            <UserManagement users={users} onUpdateBalance={handleUpdateBalance} />
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
