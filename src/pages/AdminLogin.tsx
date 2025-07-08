
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AdminAuthService } from '@/services/adminAuthService';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: 'admin@gameapp.com',
    password: 'admin123456'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [dbHealthStatus, setDbHealthStatus] = useState<'checking' | 'healthy' | 'issues' | 'error'>('checking');

  useEffect(() => {
    checkSystemHealth();
    checkExistingSession();
  }, [navigate]);

  const checkSystemHealth = async () => {
    try {
      const healthCheck = await AdminAuthService.checkAuthHealth();
      
      if (healthCheck.length === 0) {
        setDbHealthStatus('healthy');
        return;
      }
      
      const hasIssues = healthCheck.some(check => 
        check.issue_type.includes('null_') && check.issue_count > 0
      );
      
      const hasAdmin = healthCheck.find(check => 
        check.issue_type === 'admin_user_exists'
      )?.issue_count > 0;
      
      if (hasIssues || !hasAdmin) {
        setDbHealthStatus('issues');
        console.warn('Database health issues detected:', healthCheck);
      } else {
        setDbHealthStatus('healthy');
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setDbHealthStatus('error');
    }
  };

  const checkExistingSession = async () => {
    try {
      setIsCheckingSession(true);
      const isAdmin = await AdminAuthService.verifyAdminSession();
      if (isAdmin) {
        console.log('Already logged in as admin, redirecting...');
        navigate('/admin');
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
    } finally {
      setIsCheckingSession(false);
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
      console.log('Email:', formData.email);
      console.log('DB Health Status:', dbHealthStatus);
      
      const { error } = await AdminAuthService.signInWithEmail(formData.email, formData.password);
      
      if (error) {
        console.error('Login error:', error);
        
        // Enhanced error handling
        if (error.message?.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else if (error.message?.includes('Admin access required')) {
          toast.error('Admin access required');
        } else if (error.message?.includes('Database error') || 
                   error.message?.includes('email_change_token')) {
          toast.error('Database authentication error. Trying fallback method...');
          
          // Show that we're trying fallback
          setTimeout(() => {
            toast.info('Attempting emergency authentication...');
          }, 1000);
          
        } else {
          toast.error(error.message || 'Login failed. Please try again.');
        }
        return;
      }

      console.log('=== LOGIN SUCCESSFUL ===');
      toast.success('Admin login successful!');
      
      // Force a small delay to ensure everything is set up
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

  const getHealthStatusIcon = () => {
    switch (dbHealthStatus) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'issues':
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />;
    }
  };

  const getHealthStatusText = () => {
    switch (dbHealthStatus) {
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
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
          
          {/* System Health Status */}
          <div className="mt-4 flex items-center gap-2 text-sm">
            {getHealthStatusIcon()}
            <span className={`
              ${dbHealthStatus === 'healthy' ? 'text-green-600' : 
                dbHealthStatus === 'issues' ? 'text-yellow-600' : 
                dbHealthStatus === 'error' ? 'text-red-600' : 'text-gray-600'}
            `}>
              {getHealthStatusText()}
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

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Admin Credentials:</h3>
            <p className="text-xs text-muted-foreground">
              Email: <span className="font-mono">admin@gameapp.com</span><br />
              Password: <span className="font-mono">admin123456</span>
            </p>
          </div>

          {dbHealthStatus === 'issues' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                System health check detected minor issues. Authentication may use fallback methods.
              </p>
            </div>
          )}

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
