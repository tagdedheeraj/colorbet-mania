
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, RefreshCw, Shield } from 'lucide-react';
import { AdminUser } from '@/services/adminAuthService';

interface AdminHeaderProps {
  adminUser: AdminUser | null;
  onLogout: () => void;
  onRefresh?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ adminUser, onLogout, onRefresh }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
              <CardDescription>
                Welcome back, {adminUser?.username || 'Admin'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh All
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={onLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          Logged in as: <span className="font-medium">{adminUser?.email}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminHeader;
