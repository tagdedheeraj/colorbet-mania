
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SystemSettingsProps {
  adminInfo: any;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ adminInfo }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
        <CardDescription>Configure platform settings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Admin Information</h3>
            <p className="text-muted-foreground">
              Logged in as: <strong>{adminInfo?.username}</strong> ({adminInfo?.email})
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Game Settings</h3>
            <p className="text-muted-foreground">Game mode configurations and payout rates can be adjusted in the game modes config.</p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">User Management</h3>
            <p className="text-muted-foreground">User registration settings and default balance configurations.</p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Platform Status</h3>
            <p className="text-muted-foreground">System is running normally. All services are operational.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemSettings;
