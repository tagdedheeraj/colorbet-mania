
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { Wallet, CreditCard, History, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WalletHeader from '@/components/wallet/WalletHeader';

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  balance_before: number;
  balance_after: number;
  reference_id: string | null;
  status: string; // Made required to match Transaction type
}

const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useSupabaseAuthStore();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadTransactions();
    }
  }, [profile]);

  const loadTransactions = async () => {
    try {
      if (!profile?.id) return;

      console.log('💰 Loading transactions for user:', profile.id);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Transaction loading error:', error);
        throw error;
      }

      // Map database transactions to WalletTransaction format
      const mappedTransactions: WalletTransaction[] = (data || []).map(transaction => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description || '',
        created_at: transaction.created_at,
        balance_before: transaction.balance_before,
        balance_after: transaction.balance_after,
        reference_id: transaction.reference_id,
        status: 'completed' // Default status since database doesn't have this field but type requires it
      }));

      setTransactions(mappedTransactions);
      console.log('✅ Transactions loaded:', mappedTransactions.length);
    } catch (error) {
      console.error('❌ Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = () => {
    navigate('/deposit');
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

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      <WalletHeader />
      
      {/* Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Balance
          </CardTitle>
          <CardDescription>Your current account balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">₹{(profile.balance || 0).toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Available Balance</p>
            </div>
            <Button onClick={handleDeposit} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Money
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleDeposit}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Add Money</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Deposit funds to your wallet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
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
                Your recent transaction activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No transactions yet</p>
                  <p className="text-muted-foreground">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={transaction.type === 'deposit' ? 'default' : 'secondary'}>
                            {transaction.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{transaction.description}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount >= 0 ? '+' : ''}₹{transaction.amount.toFixed(2)}
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

export default WalletPage;
