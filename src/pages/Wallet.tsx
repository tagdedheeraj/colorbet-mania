import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Wallet, 
  ChevronLeft,
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Check, 
  X,
  Plus,
  Minus,
  CreditCard,
  Smartphone,
  Building
} from "lucide-react";
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  payment_method: string | null;
  transaction_reference: string | null;
  description: string | null;
  created_at: string;
}

const WalletPage = () => {
  const navigate = useNavigate();
  const { profile, session, refreshProfile } = useSupabaseAuthStore();
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('upi');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTxns, setIsLoadingTxns] = useState(true);
  
  useEffect(() => {
    if (profile) {
      loadTransactions();
    }
  }, [profile]);

  const loadTransactions = async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoadingTxns(false);
    }
  };

  const handleDeposit = async () => {
    if (!profile || !session) return;
    
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (depositAmount < 10) {
      toast.error("Minimum deposit amount is ₹10");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('payment-handler', {
        body: {
          action: 'deposit',
          amount: depositAmount,
          paymentMethod: paymentMethod
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success(`Deposit of ₹${depositAmount} initiated successfully`);
        setAmount('');
        
        // Refresh profile and transactions after a delay
        setTimeout(() => {
          refreshProfile();
          loadTransactions();
        }, 3000);
      } else {
        toast.error(data?.error || 'Deposit failed');
      }
    } catch (error) {
      console.error('Deposit error:', error);
      toast.error('Deposit failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleWithdraw = async () => {
    if (!profile || !session) return;
    
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (withdrawAmount > profile.balance) {
      toast.error("Insufficient balance");
      return;
    }

    if (withdrawAmount < 50) {
      toast.error("Minimum withdrawal amount is ₹50");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('payment-handler', {
        body: {
          action: 'withdraw',
          amount: withdrawAmount,
          paymentMethod: paymentMethod
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success(`Withdrawal of ₹${withdrawAmount} processed successfully`);
        setAmount('');
        refreshProfile();
        loadTransactions();
      } else {
        toast.error(data?.error || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Withdrawal failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
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
        return <ArrowDownLeft className="w-4 h-4 text-game-green" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-game-red" />;
      case 'bet':
        return <Minus className="w-4 h-4 text-yellow-500" />;
      case 'win':
        return <Plus className="w-4 h-4 text-game-green" />;
      case 'referral_bonus':
        return <Plus className="w-4 h-4 text-primary" />;
      case 'signup_bonus':
        return <Plus className="w-4 h-4 text-primary" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };
  
  const getTransactionText = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'bet':
        return 'Bet Placed';
      case 'win':
        return 'Game Win';
      case 'referral_bonus':
        return 'Referral Bonus';
      case 'signup_bonus':
        return 'Signup Bonus';
      default:
        return 'Transaction';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-game-green" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <X className="w-4 h-4 text-game-red" />;
      default:
        return null;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'upi':
        return <Smartphone className="w-4 h-4" />;
      case 'netbanking':
        return <Building className="w-4 h-4" />;
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Wallet className="w-4 h-4" />;
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="container-game relative z-10 py-4 px-2 sm:px-4 mb-16">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2 p-2" 
          onClick={() => navigate('/')}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">My Wallet</h1>
      </div>
      
      <div className="glass-panel p-6 rounded-xl mb-6">
        <div className="flex flex-col items-center">
          <h2 className="text-lg text-muted-foreground mb-2">Available Balance</h2>
          <div className="text-4xl font-bold text-game-gold mb-2">
            ₹{profile.balance.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">Indian Rupees</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 py-6"
            onClick={() => document.getElementById('deposit-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <ArrowDownLeft className="w-5 h-5 text-game-green" />
            <span>Deposit</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 py-6"
            onClick={() => document.getElementById('withdrawal-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <ArrowUpRight className="w-5 h-5 text-game-red" />
            <span>Withdraw</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="glass-panel" id="deposit-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-game-green" />
              <span>Deposit Money</span>
            </CardTitle>
            <CardDescription>
              Add money to your wallet (Min: ₹10)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Payment Method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      UPI
                    </div>
                  </SelectItem>
                  <SelectItem value="netbanking">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Net Banking
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Card
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              type="number"
              placeholder="Enter amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="10"
            />
            <div className="flex gap-2">
              {[100, 500, 1000, 2000].map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(preset.toString())}
                  className="flex-1"
                >
                  ₹{preset}
                </Button>
              ))}
            </div>
            <Button 
              className="w-full bg-game-green hover:bg-game-green/80 text-white"
              onClick={handleDeposit}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Deposit Now'}
            </Button>
          </CardContent>
        </Card>
        
        <Card className="glass-panel" id="withdrawal-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-game-red" />
              <span>Withdraw Money</span>
            </CardTitle>
            <CardDescription>
              Withdraw money from your wallet (Min: ₹50)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Withdrawal Method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      UPI
                    </div>
                  </SelectItem>
                  <SelectItem value="netbanking">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Bank Transfer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              type="number"
              placeholder="Enter amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="50"
              max={profile.balance}
            />
            <div className="flex gap-2">
              {[500, 1000, 2000, Math.floor(profile.balance)].map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(preset.toString())}
                  className="flex-1"
                  disabled={preset > profile.balance}
                >
                  ₹{preset}
                </Button>
              ))}
            </div>
            <Button 
              className="w-full bg-game-red hover:bg-game-red/80 text-white"
              onClick={handleWithdraw}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Withdraw Now'}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your recent wallet transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTxns ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No transactions found
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-background">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="font-medium">{getTransactionText(transaction.type)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(transaction.created_at)}
                      </div>
                      {transaction.payment_method && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getPaymentMethodIcon(transaction.payment_method)}
                          <span className="capitalize">{transaction.payment_method}</span>
                        </div>
                      )}
                      {transaction.description && (
                        <div className="text-xs text-muted-foreground">{transaction.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`font-bold ${transaction.amount > 0 ? 'text-game-green' : 'text-game-red'}`}>
                      {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toFixed(2)}
                    </div>
                    <div>{getStatusIcon(transaction.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletPage;
