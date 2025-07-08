
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Eye, EyeOff, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
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

  useEffect(() => {
    checkSystemAndSession();
  }, []);

  const checkSystemAndSession = async () => {
    try {
      setIsCheckingSession(true);
      
      // Check if user is already logged in
      const isAdmin = await AdminAuthService.verifyAdminSession();
      if (isAdmin) {
        console.log('Already logged in as admin, redirecting...');
        navigate('/admin');
        return;
      }

      // Check system health
      const healthCheck = await AdminAuthService.checkAuthHealth();
      const hasIssues = healthCheck.some(check => check.issue_count > 0);
      setSystemStatus(hasIssues ? 'issues' : 'healthy');
      
    } catch (error) {
      console.error('System check failed:', error);
      setSystemStatus('error');
    } finally {
      setIsCheckingSession(false);
    }
  };

  const initializeEmergencyAdmin = async () => {
    setIsInitializing(true);
    try {
      const result = await EmergencyAdminService.createEmergencyAdminUser();
      if (result.success) {
        toast.success('Emergency admin initialized successfully');
        setSystemStatus('healthy');
      } else {
        toast.error('Failed to initialize emergency admin');
      }
    } catch (error) {
      console.error('Emergency admin initialization failed:', error);
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
    try {
      console.log('=== ADMIN LOGIN ATTEMPT ===');
      
      // Try primary authentication
      const { error } = await AdminAuthService.signInWithEmail(formData.email, formData.password);
      
      if (error) {
        console.error('Primary login failed:', error);
        
        // Try emergency authentication
        const emergencyResult = await EmergencyAdminService.verifyEmergencyLogin(
          formData.email, 
          formData.password
        );
        
        if (emergencyResult.success) {
          toast.success('Emergency admin login successful!');
          // Create a mock session for emergency admin
          localStorage.setItem('emergency_admin_session', JSON.stringify({
            user: emergencyResult.user,
            timestamp: Date.now()
          }));
          navigate('/admin');
          return;
        }
        
        // Show appropriate error message
        if (error.message?.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else if (error.message?.includes('Admin access required')) {
          toast.error('Admin access required');
        } else {
          toast.error('Login failed. Please try again.');
        }
        return;
      }

      console.log('=== LOGIN SUCCESSFUL ===');
      toast.success('Admin login successful!');
      
      setTimeout(() => {
        navigate('/admin');
      }, 500);
      
    } catch (error) {
      console.error('Login exception:', error);
      toast.error('System error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (systemStatus) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'issues':
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
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
        return 'System Check Failed';
      default:
        return 'Checking System...';
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p>Checking admin session...</p>
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
            Enter your admin credentials to access the admin panel
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
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
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
              {loading ? 'Authenticating...' : 'Sign In'}
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
                  'Initialize Emergency Admin'
                )}
              </Button>
            </div>
          )}

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Admin Credentials:</h3>
            <p className="text-xs text-muted-foreground">
              Email: <span className="font-mono">admin@gameapp.com</span><br />
              Password: <span className="font-mono">admin123456</span>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="text-sm"
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
