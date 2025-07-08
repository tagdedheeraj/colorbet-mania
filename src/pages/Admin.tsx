
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminService } from '@/services/adminService';
import { AdminAuthService } from '@/services/adminAuthService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { MonitorSpeaker } from 'lucide-react';
import LiveGameManagement from '@/components/admin/LiveGameManagement';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminStats from '@/components/admin/AdminStats';
import UserManagement from '@/components/admin/UserManagement';
import GameManagement from '@/components/admin/GameManagement';
import BettingAnalytics from '@/components/admin/BettingAnalytics';
import SystemSettings from '@/components/admin/SystemSettings';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [bets, setBets] = useState<any[]>([]);
  const [adminInfo, setAdminInfo] = useState<any>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      console.log('Checking admin access...');
      const isValidAdmin = await AdminAuthService.verifyAdminSession();
      
      if (!isValidAdmin) {
        console.log('Access denied - not an admin');
        toast.error('Access denied. Admin login required.');
        navigate('/auth');
        return;
      }

      console.log('Admin access verified');
      const adminData = await AdminAuthService.getAdminInfo();
      setAdminInfo(adminData);
      
      await loadAdminData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast.error('Error checking admin access');
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      console.log('Loading admin data...');
      const [usersResult, gamesResult, betsResult] = await Promise.all([
        AdminService.getAllUsers(),
        AdminService.getAllGames(),
        AdminService.getAllBets()
      ]);

      console.log('Users loaded:', usersResult.data.length);
      console.log('Games loaded:', gamesResult.data.length);
      console.log('Bets loaded:', betsResult.data.length);

      setUsers(usersResult.data);
      setGames(gamesResult.data);
      setBets(betsResult.data);

      if (usersResult.error) {
        console.error('Users loading error:', usersResult.error);
      }
      if (gamesResult.error) {
        console.error('Games loading error:', gamesResult.error);
      }
      if (betsResult.error) {
        console.error('Bets loading error:', betsResult.error);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
      <div className="container mx-auto max-w-7xl">
        <AdminHeader adminInfo={adminInfo} />
        <AdminStats users={users} games={games} bets={bets} />

        <Tabs defaultValue="live" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="live">Live Game</TabsTrigger>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="bets">Bets</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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

          <TabsContent value="settings" className="space-y-4">
            <SystemSettings adminInfo={adminInfo} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
