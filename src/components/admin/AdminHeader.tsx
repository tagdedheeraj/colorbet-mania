
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminUser } from '@/services/adminAuthService';

interface AdminHeaderProps {
  adminUser: AdminUser | null;
  onLogout: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ adminUser, onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">
            Welcome, {adminUser?.username} - Manage your gaming platform
          </p>
        </div>
      </div>
      
      <Button
        variant="destructive"
        onClick={onLogout}
        className="flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </div>
  );
};

export default AdminHeader;
