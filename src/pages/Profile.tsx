
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings, KeyRound, ChevronLeft, UserCircle, PhoneCall, Mail, Edit, Save } from "lucide-react";
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useSupabaseAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: profile?.full_name || '',
    email: user?.email || '',
    mobile: profile?.phone || ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  if (!user) {
    navigate('/');
    return null;
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfile({
        full_name: profileForm.name,
        phone: profileForm.mobile
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });
      
      if (error) throw error;
      
      toast.success('Password updated successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.error(error.message || 'Failed to update password');
    }
  };

  return (
    <div className="container-game relative z-10 py-4 px-2 sm:px-4 mb-16">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2 p-2" 
          onClick={() => navigate('/')}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">My Profile</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card className="glass-panel">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Profile Information</CardTitle>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2"
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Cancel</span>
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </>
                  )}
                </Button>
              </div>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit}>
                <div className="grid gap-6">
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCircle className="w-20 h-20 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">{profile?.username || 'User'}</h2>
                    <div className="px-4 py-2 rounded-full bg-game-gold/20 text-game-gold font-bold">
                      {profile?.balance?.toFixed(2) || '0.00'} coins
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full Name</Label>
                      {isEditing ? (
                        <Input 
                          id="name" 
                          value={profileForm.name} 
                          onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 border rounded-md">
                          <UserCircle className="w-5 h-5 text-muted-foreground" />
                          <span>{profileForm.name || 'Not set'}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <span>{profileForm.email || 'Not set'}</span>
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="mobile">Mobile Number</Label>
                      {isEditing ? (
                        <Input 
                          id="mobile" 
                          value={profileForm.mobile} 
                          onChange={(e) => setProfileForm({...profileForm, mobile: e.target.value})}
                          placeholder="Enter your mobile number"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 border rounded-md">
                          <PhoneCall className="w-5 h-5 text-muted-foreground" />
                          <span>{profileForm.mobile || 'Not set'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {isEditing && (
                  <Button type="submit" className="w-full mt-6">
                    Save Changes
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit}>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type="password"
                        className="pl-10"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        placeholder="Enter new password"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        className="pl-10"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        placeholder="Confirm new password"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <Button type="submit" className="w-full mt-6">
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
