
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Eye, EyeOff, AlertTriangle, CheckCircle, RefreshCw, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { AdminAuthService } from '@/services/adminAuthService';
import { EmergencyAdminService } from '@/services/emergencyAdminService';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: 'admin@gameapp.com',
    password: 'admin123456'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [systemStatus, setSystemStatus] = useState<'checking' | 'healthy' | 'issues' | 'error'>('checking');
  const [isInitializing, setIsInitializing] = useState(false);
  const [authMethod, setAuthMethod] = useState<string | null>(null);

  useEffect(() => {
    checkSystemAndSession();
  }, []);

  const checkSystemAndSession = async () => {
    try {
      setIsCheckingSession(true);
      console.log('🔍 Checking admin session and system health...');
      
      // Check if user is already logged in
      const isAdmin = await AdminAuthService.verifyAdminSession();
      if (isAdmin) {
        console.log('✅ Already logged in as admin, redirecting...');
        toast.success('Already logged in, redirecting...');
        navigate('/admin');
        return;
      }

      // Check system health
      const healthCheck = await AdminAuthService.checkAuthHealth();
      const hasIssues = healthCheck.some(check => check.issue_count > 0);
      
      if (hasIssues) {
        console.log('⚠️ System health issues detected:', healthCheck);
        setSystemStatus('issues');
        
        const criticalIssues = healthCheck.filter(check => 
          check.issue_type === 'database_connection' && check.issue_count > 0
        );
        
        if (criticalIssues.length > 0) {
          setSystemStatus('error');
        }
      } else {
        console.log('✅ System health check passed');
        setSystemStatus('healthy');
      }
      
    } catch (error) {
      console.error('❌ System check failed:', error);
      setSystemStatus('error');
      toast.error('System check failed');
    } finally {
      setIsCheckingSession(false);
    }
  };

  const initializeEmergencyAdmin = async () => {
    setIsInitializing(true);
    try {
      console.log('🚨 Initializing emergency admin...');
      const result = await AdminAuthService.initializeEmergencyAdmin();
      
      if (result.success) {
        toast.success('Emergency admin initialized successfully');
        setSystemStatus('healthy');
        console.log('✅ Emergency admin ready');
      } else {
        toast.error('Failed to initialize emergency admin');
        console.error('❌ Emergency admin initialization failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Emergency admin initialization exception:', error);
      toast.error('Emergency admin initialization failed');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    setAuthMethod(null);
    
    try {
      console.log('🔐 Starting admin login process...');
      
      const result = await AdminAuthService.signInWithEmail(formData.email, formData.password);
      
      if (result.success) {
        setAuthMethod(result.method || 'unknown');
        
        // Handle different authentication methods
        if (result.method === 'emergency') {
          toast.success('🚨 Emergency admin access granted!');
          EmergencyAdminService.createEmergencySession(result.user);
        } else if (result.method === 'database_fallback') {
          toast.success('🔄 Database fallback login successful!');
          EmergencyAdminService.createEmergencySession(result.user);
        } else {
          toast.success('✅ Admin login successful!');
        }
        
        console.log(`✅ Login successful via ${result.method}`);
        
        // Small delay for user feedback, then redirect
        setTimeout(() => {
          navigate('/admin');
        }, 1000);
        
      } else {
        console.error('❌ All authentication methods failed:', result.error);
        
        // Provide specific error messages
        const errorMessage = result.error?.message || 'Authentication failed';
        
        if (errorMessage.includes('Admin access required')) {
          toast.error('Admin access required - insufficient permissions');
        } else if (errorMessage.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else if (errorMessage.includes('All authentication methods failed')) {
          toast.error('System authentication failure - please try emergency initialization');
        } else {
          toast.error(`Login failed: ${errorMessage}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Login exception:', error);
      toast.error('System error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (systemStatus) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'issues':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 animate-spin text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (systemStatus) {
      case 'healthy':
        return 'System Ready';
      case 'issues':
        return 'Minor Issues Detected';
      case 'error':
        return 'System Needs Repair';
      default:
        return 'Checking System...';
    }
  };

  const getAuthMethodBadge = () => {
    if (!authMethod) return null;
    
    const methodConfig = {
      primary: { icon: CheckCircle, text: 'Primary Auth', color: 'text-green-600' },
      emergency: { icon: Zap, text: 'Emergency Mode', color: 'text-yellow-600' },
      database_fallback: { icon: RefreshCw, text: 'Fallback Mode', color: 'text-blue-600' }
    };
    
    const config = methodConfig[authMethod as keyof typeof methodConfig];
    if (!config) return null;
    
    const IconComponent = config.icon;
    
    return (
      <div className={`flex items-center gap-2 text-sm ${config.color} mt-2`}>
        <IconComponent className="h-4 w-4" />
        <span>{config.text}</span>
      </div>
    );
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Checking admin session...</p>
          <p className="text-sm text-muted-foreground">Verifying authentication status</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Multi-path authentication system with emergency fallback
          </CardDescription>
          
          <div className="mt-4 flex items-center gap-2 text-sm">
            {getStatusIcon()}
            <span className={`
              ${systemStatus === 'healthy' ? 'text-green-600' : 
                systemStatus === 'issues' ? 'text-yellow-600' : 
                systemStatus === 'error' ? 'text-red-600' : 'text-gray-600'}
            `}>
              {getStatusText()}
            </span>
          </div>
          
          {getAuthMethodBadge()}
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter admin email"
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter admin password"
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {systemStatus === 'error' && (
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={initializeEmergencyAdmin}
                disabled={isInitializing}
                className="w-full"
              >
                {isInitializing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Initialize Emergency Admin
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-semibold mb-2">System Features:</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✅ Primary Supabase Authentication</li>
              <li>🚨 Emergency Backup System</li>
              <li>🔄 Database Fallback Mode</li>
              <li>🛡️ Multi-layer Security</li>
            </ul>
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>Credentials:</strong><br/>
                Email: <span className="font-mono">admin@gameapp.com</span><br/>
                Password: <span className="font-mono">admin123456</span>
              </p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="text-sm"
              disabled={loading}
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
