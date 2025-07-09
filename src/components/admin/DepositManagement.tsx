
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CreditCard } from 'lucide-react';
import DepositRequestStats from './DepositRequestStats';
import DepositRequestCard from './DepositRequestCard';
import { DepositRequest, DepositStats } from '@/services/depositRequestService';

interface DepositManagementProps {
  depositRequests: DepositRequest[];
  depositStats: DepositStats | null;
  loading: boolean;
  onRefresh: () => void;
  onApprove: (id: string, notes?: string) => Promise<void>;
  onReject: (id: string, notes: string) => Promise<void>;
}

const DepositManagement: React.FC<DepositManagementProps> = ({
  depositRequests,
  depositStats,
  loading,
  onRefresh,
  onApprove,
  onReject
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Deposit Requests Management</CardTitle>
            <CardDescription>Review and approve user deposit requests</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Deposit Stats */}
        <DepositRequestStats stats={depositStats} loading={loading} />
        
        {/* Deposit Requests */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p>Loading deposit requests...</p>
            </div>
          ) : depositRequests.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No deposit requests found</p>
              <p className="text-muted-foreground">New deposit requests will appear here automatically</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {depositRequests.map((request) => (
                <DepositRequestCard
                  key={request.id}
                  request={request}
                  onApprove={onApprove}
                  onReject={onReject}
                  loading={loading}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DepositManagement;
