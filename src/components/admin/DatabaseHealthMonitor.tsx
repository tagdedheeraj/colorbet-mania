
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertTriangle, Database } from 'lucide-react';
import { AdminAuthService, AuthHealthCheck } from '@/services/adminAuthService';
import { toast } from 'sonner';

const DatabaseHealthMonitor: React.FC = () => {
  const [healthData, setHealthData] = useState<AuthHealthCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const health = await AdminAuthService.checkAuthHealth();
      setHealthData(health);
      setLastChecked(new Date());
      
      const issues = health.filter(check => 
        check.issue_type.includes('null_') && check.issue_count > 0
      );
      
      if (issues.length > 0) {
        toast.warning(`Found ${issues.length} database health issues`);
      } else {
        toast.success('Database health check passed');
      }
    } catch (error) {
      console.error('Health check failed:', error);
      toast.error('Health check failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusColor = (issueType: string, count: number) => {
    if (issueType === 'admin_user_exists') {
      return count > 0 ? 'text-green-600' : 'text-red-600';
    }
    return count > 0 ? 'text-yellow-600' : 'text-green-600';
  };

  const getStatusIcon = (issueType: string, count: number) => {
    if (issueType === 'admin_user_exists') {
      return count > 0 ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />;
    }
    return count > 0 ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Health Monitor
        </CardTitle>
        <CardDescription>
          Monitor authentication system health and detect issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : 'Never checked'}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkHealth}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Check Health
            </Button>
          </div>

          {healthData.length > 0 ? (
            <div className="space-y-2">
              {healthData.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className={getStatusColor(check.issue_type, check.issue_count)}>
                      {getStatusIcon(check.issue_type, check.issue_count)}
                    </span>
                    <span className="text-sm font-medium">{check.details}</span>
                  </div>
                  <span className={`text-sm font-mono ${getStatusColor(check.issue_type, check.issue_count)}`}>
                    {check.issue_count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Click "Check Health" to run system diagnostics</p>
            </div>
          )}

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <strong>Health Check Items:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Admin user existence</li>
              <li>• Authentication system integrity</li>
              <li>• Database connection status</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseHealthMonitor;
