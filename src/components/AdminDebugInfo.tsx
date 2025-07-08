
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, User, Shield } from 'lucide-react';

const AdminDebugInfo: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkAdminStatus = async () => {
    setLoading(true);
    try {
      console.log('🔍 Running admin debug check...');
      
      // Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      let userInfo = null;
      if (session?.user) {
        // Check user in database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        userInfo = {
          userData,
          userError: userError?.message
        };
      }

      // Check if admin user exists
      const { data: adminUsers, error: adminError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'admin@tradeforwin.xyz');

      setDebugInfo({
        session: session ? {
          userId: session.user.id,
          email: session.user.email,
          role: session.user.role
        } : null,
        sessionError: sessionError?.message,
        userInfo,
        adminUsers,
        adminError: adminError?.message,
        timestamp: new Date().toISOString()
      });

      console.log('🔍 Debug info:', {
        session: !!session,
        user: !!session?.user,
        adminUsers: adminUsers?.length || 0
      });

    } catch (error) {
      console.error('❌ Debug check failed:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, []);

  if (!debugInfo) return null;

  return (
    <Card className="mt-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Database className="h-4 w-4" />
          Admin Debug Information
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={checkAdminStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div>
          <Badge variant={debugInfo.session ? "default" : "destructive"}>
            <User className="h-3 w-3 mr-1" />
            Session: {debugInfo.session ? 'Active' : 'None'}
          </Badge>
          {debugInfo.session && (
            <div className="mt-1 text-muted-foreground">
              User: {debugInfo.session.email} ({debugInfo.session.userId})
            </div>
          )}
        </div>

        <div>
          <Badge variant={debugInfo.adminUsers?.length > 0 ? "default" : "destructive"}>
            <Shield className="h-3 w-3 mr-1" />
            Admin Users: {debugInfo.adminUsers?.length || 0}
          </Badge>
          {debugInfo.adminUsers?.map((user: any) => (
            <div key={user.id} className="mt-1 text-muted-foreground">
              {user.email} - Role: {user.role} - ID: {user.id.slice(0, 8)}...
            </div>
          ))}
        </div>

        {debugInfo.error && (
          <div className="text-red-600 font-mono">
            Error: {debugInfo.error}
          </div>
        )}

        <div className="text-muted-foreground">
          Last checked: {new Date(debugInfo.timestamp).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDebugInfo;
