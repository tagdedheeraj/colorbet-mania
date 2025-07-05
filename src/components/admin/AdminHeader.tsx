
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';
import { AdminAuthService } from '@/services/adminAuthService';
import { toast } from 'sonner';

interface AdminHeaderProps {
  adminInfo: any;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ adminInfo }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await AdminAuthService.logout();
      toast.success('Admin logged out successfully');
      navigate('/admin-login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout');
    }
  };

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
            Welcome, {adminInfo?.username} - Manage your gaming platform
          </p>
        </div>
      </div>
      
      <Button
        variant="destructive"
        onClick={handleLogout}
        className="flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </div>
  );
};

export default AdminHeader;
