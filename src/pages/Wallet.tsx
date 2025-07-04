
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, History, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { supabase } from '@/integrations/supabase/client';

const Wallet: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSupabaseAuthStore();
  const [balance, setBalance] = useState<number>(0);
  const [amount, setAmount] = useState<string>('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    loadWalletData();
  }, [isAuthenticated, navigate]);

  const loadWalletData = async () => {
    if (!user) return;

    try {
      // Load user balance from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setBalance(profileData?.balance || 0);

      // Load transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionError) throw transactionError;
      setTransactions(transactionData || []);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      toast.error('Failed to load wallet data');
    }
  };

  const handleAddFunds = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const addAmount = parseFloat(amount);
      const newBalance = balance + addAmount;

      // Update user balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Add transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          type: 'deposit',
          amount: addAmount,
          balance_before: balance,
          balance_after: newBalance,
          description: 'Funds added to wallet'
        });

      if (transactionError) throw transactionError;

      setBalance(newBalance);
      setAmount('');
      toast.success('Funds added successfully');
      loadWalletData();
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error('Failed to add funds');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <Minus className="h-4 w-4 text-red-500" />;
      case 'bet':
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      case 'win':
        return <Plus className="h-4 w-4 text-green-500" />;
      default:
        return <History className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
      <div className="container mx-auto px-4 py-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Wallet</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {balance.toFixed(2)} coins
                </div>
                <p className="text-muted-foreground mt-2">
                  Available for betting
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Wallet Actions */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="add-funds" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="add-funds">Add Funds</TabsTrigger>
                <TabsTrigger value="transactions">Transaction History</TabsTrigger>
              </TabsList>

              <TabsContent value="add-funds" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Add Funds</CardTitle>
                    <CardDescription>
                      Add coins to your wallet for betting
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Amount (Coins)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="1"
                        step="0.01"
                      />
                    </div>
                    <Button 
                      onClick={handleAddFunds}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Processing...' : 'Add Funds'}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      * This is a demo environment. In production, this would integrate with payment processors.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>
                      Your recent wallet activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {transactions.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No transactions yet
                        </p>
                      ) : (
                        transactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {getTransactionIcon(transaction.type)}
                              <div>
                                <p className="font-medium">
                                  {transaction.description || transaction.type}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(transaction.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium ${
                                transaction.type === 'deposit' || transaction.type === 'win'
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}>
                                {transaction.type === 'deposit' || transaction.type === 'win' ? '+' : '-'}
                                {Math.abs(transaction.amount).toFixed(2)}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                completed
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
