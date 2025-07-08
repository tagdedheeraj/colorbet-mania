
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Eye, EyeOff, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import AdminAuthService from '@/services/adminAuthService';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: 'admin@tradeforwin.xyz',
    password: 'Trade@123'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      console.log('🔍 Checking existing admin session...');
      const { authenticated } = await AdminAuthService.isAuthenticated();
      if (authenticated) {
        console.log('✅ Already logged in as admin, redirecting...');
        navigate('/admin');
        return;
      }
      console.log('ℹ️ No existing admin session');
    } catch (error) {
      console.error('❌ Session check failed:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!formData.password.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🚀 Submitting login form...');
      const result = await AdminAuthService.login(formData.email.trim(), formData.password.trim());
      
      if (result.success) {
        console.log('✅ Login successful, redirecting to admin panel...');
        setTimeout(() => {
          navigate('/admin', { replace: true });
        }, 500);
      } else {
        const errorMessage = result.error?.message || 'Login failed';
        console.error('❌ Login failed:', errorMessage);
        setError(errorMessage);
      }
      
    } catch (error) {
      console.error('❌ Login exception:', error);
      const errorMessage = 'System error occurred during login';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Checking admin session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">TradeForWin Admin</CardTitle>
            <CardDescription>
              Login to access the admin dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              )}

              <div>
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter admin email"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="password">Admin Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
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
                    Signing In...
                  </>
                ) : (
                  'Sign In to Admin Panel'
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
              <p className="text-sm text-muted-foreground">
                <strong>Admin Credentials:</strong><br/>
                Email: <span className="font-mono text-primary">admin@tradeforwin.xyz</span><br/>
                Password: <span className="font-mono text-primary">Trade@123</span>
              </p>
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
    </div>
  );
};

export default AdminLogin;
