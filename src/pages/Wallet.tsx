
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { Wallet, CreditCard, History, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WalletBalance from '@/components/wallet/WalletBalance';
import WalletHeader from '@/components/wallet/WalletHeader';
import TransactionHistory from '@/components/wallet/TransactionHistory';

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  balance_before: number;
  balance_after: number;
  reference_id: string | null;
  status?: string; // Make status optional to match database schema
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
        status: 'completed' // Default status since database doesn't have this field
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
      <WalletBalance 
        balance={profile.balance || 0}
        onDeposit={handleDeposit}
      />

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
          <TransactionHistory 
            transactions={transactions}
            loading={loading}
            onRefresh={loadTransactions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletPage;
