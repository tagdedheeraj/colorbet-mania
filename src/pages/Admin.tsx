
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminService } from '@/services/adminService';
import { AdminAuthService } from '@/services/adminAuthService';
import { EmergencyAdminService } from '@/services/emergencyAdminService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { MonitorSpeaker, Database, Zap, Shield } from 'lucide-react';
import LiveGameManagement from '@/components/admin/LiveGameManagement';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminStats from '@/components/admin/AdminStats';
import UserManagement from '@/components/admin/UserManagement';
import GameManagement from '@/components/admin/GameManagement';
import BettingAnalytics from '@/components/admin/BettingAnalytics';
import SystemSettings from '@/components/admin/SystemSettings';
import DatabaseHealthMonitor from '@/components/admin/DatabaseHealthMonitor';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [bets, setBets] = useState<any[]>([]);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'normal' | 'emergency' | 'fallback'>('normal');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      console.log('🔍 Checking admin access...');
      
      // Check for emergency session first
      const hasEmergencySession = EmergencyAdminService.validateEmergencySession();
      if (hasEmergencySession) {
        console.log('🚨 Using emergency admin session');
        setAuthMode('emergency');
        
        const emergencySession = localStorage.getItem('emergency_admin_session');
        if (emergencySession) {
          const session = JSON.parse(emergencySession);
          setAdminInfo({
            username: 'admin',
            email: 'admin@gameapp.com',
            id: session.user?.id || 'emergency-admin'
          });
        }
        
        await loadAdminData();
        setLoading(false);
        return;
      }

      // Check normal admin session
      const isValidAdmin = await AdminAuthService.verifyAdminSession();
      
      if (!isValidAdmin) {
        console.log('❌ Access denied - redirecting to admin login');
        toast.error('Admin access required. Please login as administrator.');
        navigate('/admin-login');
        return;
      }

      console.log('✅ Normal admin access verified');
      setAuthMode('normal');
      
      const adminData = await AdminAuthService.getAdminInfo();
      setAdminInfo(adminData);
      
      await loadAdminData();
    } catch (error) {
      console.error('❌ Error checking admin access:', error);
      toast.error('Error checking admin access');
      navigate('/admin-login');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      console.log('📊 Loading admin dashboard data...');
      
      const [usersResult, gamesResult, betsResult] = await Promise.all([
        AdminService.getAllUsers(),
        AdminService.getAllGames(),
        AdminService.getAllBets()
      ]);

      console.log(`✅ Data loaded: ${usersResult.data?.length || 0} users, ${gamesResult.data?.length || 0} games, ${betsResult.data?.length || 0} bets`);

      setUsers(usersResult.data || []);
      setGames(gamesResult.data || []);
      setBets(betsResult.data || []);

      // Log any loading errors
      if (usersResult.error) {
        console.error('❌ Users loading error:', usersResult.error);
        toast.error('Failed to load users data');
      }
      if (gamesResult.error) {
        console.error('❌ Games loading error:', gamesResult.error);
        toast.error('Failed to load games data');
      }
      if (betsResult.error) {
        console.error('❌ Bets loading error:', betsResult.error);
        toast.error('Failed to load bets data');
      }
    } catch (error) {
      console.error('❌ Error loading admin data:', error);
      toast.error('Failed to load admin data');
    }
  };

  const getAuthModeInfo = () => {
    switch (authMode) {
      case 'emergency':
        return {
          icon: Zap,
          text: 'Emergency Mode Active',
          description: 'Using emergency admin access',
          color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
        };
      case 'fallback':
        return {
          icon: Database,
          text: 'Fallback Mode Active',
          description: 'Using database fallback authentication',
          color: 'bg-blue-50 border-blue-200 text-blue-800'
        };
      default:
        return {
          icon: Shield,
          text: 'Normal Mode',
          description: 'Standard Supabase authentication',
          color: 'bg-green-50 border-green-200 text-green-800'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Verifying admin access...</p>
          <p className="text-sm text-muted-foreground">Loading admin dashboard</p>
        </div>
      </div>
    );
  }

  const authInfo = getAuthModeInfo();
  const AuthIcon = authInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
      <div className="container mx-auto max-w-7xl">
        {authMode !== 'normal' && (
          <div className={`mb-4 p-4 rounded-lg border ${authInfo.color}`}>
            <div className="flex items-center gap-3">
              <AuthIcon className="h-5 w-5" />
              <div>
                <p className="font-semibold">{authInfo.text}</p>
                <p className="text-sm opacity-90">{authInfo.description}</p>
              </div>
            </div>
          </div>
        )}
        
        <AdminHeader adminInfo={adminInfo} />
        <AdminStats users={users} games={games} bets={bets} />

        <Tabs defaultValue="live" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="live">Live Game</TabsTrigger>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="bets">Bets</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MonitorSpeaker className="h-5 w-5" />
                  Live Game Management
                </CardTitle>
                <CardDescription>Monitor and control active games in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                <LiveGameManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement users={users} onDataReload={loadAdminData} />
          </TabsContent>

          <TabsContent value="games" className="space-y-4">
            <GameManagement games={games} />
          </TabsContent>

          <TabsContent value="bets" className="space-y-4">
            <BettingAnalytics bets={bets} />
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <SystemSettings adminInfo={adminInfo} />
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <DatabaseHealthMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
