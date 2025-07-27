
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDownLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WalletBalanceProps {
  balance: number;
  onRefresh: () => void;
}

const WalletBalance: React.FC<WalletBalanceProps> = ({ balance, onRefresh }) => {
  const navigate = useNavigate();

  return (
    <Card className="mb-6">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Current Balance</CardTitle>
        <div className="text-4xl font-bold text-primary">
          ₹{balance.toFixed(2)}
        </div>
      </CardHeader>
      <CardContent className="flex justify-center gap-4">
        <Button 
          onClick={() => navigate('/deposit')}
          className="flex items-center gap-2"
        >
          <ArrowDownLeft className="h-4 w-4" />
          Add Funds
        </Button>
        <Button 
          variant="outline" 
          onClick={onRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </CardContent>
    </Card>
  );
};

export default WalletBalance;
