
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

const Wallet: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, refreshProfile } = useSupabaseAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    loadTransactions();
  }, [isAuthenticated, navigate]);

  const loadTransactions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading transactions:', error);
        toast.error('Failed to load transactions');
        return;
      }

      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'signup_bonus':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'bet':
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      default:
        return <History className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = ['deposit', 'signup_bonus'].includes(type) ? '+' : '-';
    return `${sign}₹${Math.abs(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-center mb-2">My Wallet</h1>
          <p className="text-center text-muted-foreground">Manage your funds and view transaction history</p>
        </div>

        {/* Balance Card */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Current Balance</CardTitle>
            <div className="text-4xl font-bold text-primary">
              ₹{profile?.balance?.toFixed(2) || '0.00'}
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
              onClick={refreshProfile}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction History
            </CardTitle>
            <CardDescription>
              View all your recent transactions and account activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No transactions yet</p>
                <p className="text-sm text-muted-foreground">Your transaction history will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`font-semibold ${
                          ['deposit', 'signup_bonus'].includes(transaction.type) 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {formatAmount(transaction.amount, transaction.type)}
                        </p>
                      </div>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Wallet;
