
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, TrendingUp, CreditCard } from 'lucide-react';
import { DepositStats } from '@/services/depositRequestService';

interface DepositRequestStatsProps {
  stats: DepositStats | null;
  loading?: boolean;
}

const DepositRequestStats: React.FC<DepositRequestStatsProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="h-6 w-12 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{stats.pending_count}</p>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <CreditCard className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold">₹{stats.pending_amount.toLocaleString('en-IN')}</p>
              <p className="text-sm text-muted-foreground">Pending Amount</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.today_approved_count}</p>
              <p className="text-sm text-muted-foreground">Today Approved</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">₹{stats.today_approved_amount.toLocaleString('en-IN')}</p>
              <p className="text-sm text-muted-foreground">Today Approved Amount</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositRequestStats;
