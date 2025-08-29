
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Trophy, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { supabase } from '@/integrations/supabase/client';

interface ProfileBet {
  id: string;
  user_id: string;
  period_number: number;
  bet_type: 'color' | 'number';
  bet_value: string;
  amount: number;
  profit: number;
  status: string;
  created_at: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useSupabaseAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [userRecord, setUserRecord] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    loadProfileData();
  }, [isAuthenticated, navigate]);

  const loadProfileData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // Load user stats from bets table
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id);

      if (betsError) throw betsError;

      const profileBets: ProfileBet[] = betsData || [];
      const totalBets = profileBets.length;
      
      // Calculate wins based on profit > 0 and status = 'won'
      const totalWins = profileBets.filter(bet => bet.status === 'won' && bet.profit > 0).length;
      const totalWinnings = profileBets
        .filter(bet => bet.status === 'won' && bet.profit > 0)
        .reduce((sum, bet) => sum + bet.profit, 0);

      setUserRecord(profileData);
      setProfile(profileData);
      setUserStats({
        totalBets,
        totalWins,
        totalWinnings,
        winRate: totalBets > 0 ? ((totalWins / totalBets) * 100).toFixed(1) : '0'
      });

      setFormData({
        email: profileData?.email || '',
        username: profileData?.username || ''
      });
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    try {
      // Update profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: formData.email,
          username: formData.username
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast.success('Profile updated successfully');
      loadProfileData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout');
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
      <div className="container mx-auto px-4 py-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Profile</h1>
          </div>
          
          {/* Logout Button */}
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Enter username"
                    />
                  </div>

                  <div>
                    <Label htmlFor="balance">Current Balance</Label>
                    <Input
                      id="balance"
                      type="text"
                      value={`${userRecord?.balance || 0} coins`}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <Button type="submit" disabled={updating} className="w-full">
                    {updating ? 'Updating...' : 'Update Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Stats and Account Info */}
          <div className="space-y-6">
            {/* Account Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Gaming Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Bets:</span>
                  <span className="font-semibold">{userStats.totalBets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Wins:</span>
                  <span className="font-semibold text-green-600">{userStats.totalWins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate:</span>
                  <span className="font-semibold">{userStats.winRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Winnings:</span>
                  <span className="font-semibold text-green-600">{userStats.totalWinnings?.toFixed(2)} coins</span>
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Account Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member since:</span>
                  <span className="font-semibold">
                    {userRecord?.created_at ? new Date(userRecord.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID:</span>
                  <span className="font-mono text-xs">{user?.id?.slice(0, 8)}...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
