
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, GamepadIcon, TrendingUp, CreditCard } from 'lucide-react';

interface AdminStatsCardsProps {
  usersCount: number;
  gamesCount: number;
  betsCount: number;
  pendingDeposits: number;
  totalBalance: number;
}

const AdminStatsCards: React.FC<AdminStatsCardsProps> = ({
  usersCount,
  gamesCount,
  betsCount,
  pendingDeposits,
  totalBalance
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{usersCount}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <GamepadIcon className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{gamesCount}</p>
              <p className="text-sm text-muted-foreground">Total Games</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{betsCount}</p>
              <p className="text-sm text-muted-foreground">Total Bets</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <CreditCard className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{pendingDeposits}</p>
              <p className="text-sm text-muted-foreground">Pending Deposits</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">₹{totalBalance.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Total Balance</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStatsCards;
