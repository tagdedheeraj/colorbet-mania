
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet as WalletIcon, Plus, Minus, History, CreditCard } from 'lucide-react';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LoadingScreen from '@/components/LoadingScreen';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

const Wallet = () => {
  const { profile, refreshProfile, isLoading: authLoading } = useSupabaseAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    if (profile) {
      loadTransactions();
    }
  }, [profile]);

  const loadTransactions = async () => {
    try {
      setIsLoadingTransactions(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      // For demo purposes, we'll simulate a successful deposit
      await supabase
        .from('transactions')
        .insert({
          type: 'deposit',
          amount: amount,
          description: 'Wallet deposit'
        });

      await refreshProfile();
      setDepositAmount('');
      loadTransactions();
      toast.success('Deposit successful!');
    } catch (error) {
      console.error('Deposit error:', error);
      toast.error('Deposit failed');
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!profile || profile.balance < amount) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      // For demo purposes, we'll simulate a successful withdrawal
      await supabase
        .from('transactions')
        .insert({
          type: 'withdrawal',
          amount: -amount,
          description: 'Wallet withdrawal'
        });

      await refreshProfile();
      setWithdrawAmount('');
      loadTransactions();
      toast.success('Withdrawal successful!');
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Withdrawal failed');
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

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'signup_bonus':
      case 'win':
        return 'text-green-500';
      case 'withdrawal':
      case 'bet':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  if (authLoading || !profile) {
    return <LoadingScreen />;
  }

  return (
    <div className="container mx-auto p-4 pb-20 lg:pb-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <WalletIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Wallet</h1>
        </div>

        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletIcon className="w-5 h-5" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              ₹{profile.balance?.toFixed(2) || '0.00'}
            </div>
            <p className="text-muted-foreground mt-2">Available for betting</p>
          </CardContent>
        </Card>

        {/* Deposit/Withdraw Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Plus className="w-5 h-5" />
                Deposit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="number"
                placeholder="Enter amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="1"
              />
              <Button 
                onClick={handleDeposit} 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!depositAmount}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Deposit Money
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Minus className="w-5 h-5" />
                Withdraw
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="1"
                max={profile.balance || 0}
              />
              <Button 
                onClick={handleWithdraw} 
                variant="destructive" 
                className="w-full"
                disabled={!withdrawAmount}
              >
                <Minus className="w-4 h-4 mr-2" />
                Withdraw Money
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTransactions ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions yet
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{transaction.type.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
                    <div className={`font-bold text-lg ${getTransactionColor(transaction.type)}`}>
                      {transaction.amount > 0 ? '+' : ''}₹{transaction.amount.toFixed(2)}
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
