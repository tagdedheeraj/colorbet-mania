
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/store/supabaseAuthStore';
import { useNavigate } from 'react-router-dom';
import { Wallet as WalletIcon, Plus, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  balance_before: number;
  balance_after: number;
  reference_id: string | null;
  status?: string; // Make optional since it might not exist in database
}

const Wallet: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      loadTransactions();
    }
  }, [profile?.id]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      console.log('💰 Loading transactions...');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Map to WalletTransaction format with default status
      const mappedTransactions: WalletTransaction[] = (data || []).map(transaction => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description || '',
        created_at: transaction.created_at,
        balance_before: transaction.balance_before,
        balance_after: transaction.balance_after,
        reference_id: transaction.reference_id,
        status: 'completed' // Default status since it's not in the database
      }));

      setTransactions(mappedTransactions);
      console.log('✅ Transactions loaded:', mappedTransactions.length);
    } catch (error) {
      console.error('❌ Error loading transactions:', error);
      toast.error('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = () => {
    navigate('/deposit');
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'bet':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'win':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      default:
        return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (type === 'deposit' || type === 'win' || amount > 0) {
      return 'text-green-600';
    }
    if (type === 'bet' || amount < 0) {
      return 'text-red-600';
    }
    return 'text-muted-foreground';
  };

  if (!profile) {
    return (
      <div className="container mx-auto max-w-4xl p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to view your wallet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats from transactions
  const totalDeposits = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalBets = transactions
    .filter(t => t.type === 'bet')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const totalWins = transactions
    .filter(t => t.type === 'win')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      {/* Wallet Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <WalletIcon className="h-6 w-6" />
                My Wallet
              </CardTitle>
              <CardDescription>Manage your balance and view transaction history</CardDescription>
            </div>
            <Button onClick={handleDeposit} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Funds
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-2">Current Balance</p>
            <p className="text-4xl font-bold text-primary">₹{profile.balance.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalDeposits.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bets</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{totalBets.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wins</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalWins.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View all your wallet transactions and activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p>Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <ArrowUpDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No transactions yet</p>
                  <p className="text-muted-foreground">Make a deposit to get started</p>
                  <Button onClick={handleDeposit} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Make First Deposit
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {transaction.type}
                            </Badge>
                            {transaction.status && (
                              <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                                {transaction.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {transaction.description || `${transaction.type} transaction`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className={`font-medium ${getTransactionColor(transaction.type, transaction.amount)}`}>
                          {transaction.amount >= 0 ? '+' : ''}₹{Math.abs(transaction.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Balance: ₹{transaction.balance_after.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Wallet;
