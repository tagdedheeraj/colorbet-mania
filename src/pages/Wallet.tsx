
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, 
  ChevronLeft,
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Check, 
  X,
  Plus,
  Minus
} from "lucide-react";
import useAuthStore from '@/store/authStore';
import { Transaction, TransactionType } from '@/types/game';
import { toast } from "sonner";

const WalletPage = () => {
  const navigate = useNavigate();
  const { user, updateBalance, getTransactions, addTransaction } = useAuthStore();
  const [amount, setAmount] = useState<string>('');
  
  if (!user) {
    navigate('/');
    return null;
  }
  
  const transactions = getTransactions();
  const deposits = getTransactions('deposit');
  const withdrawals = getTransactions('withdrawal');
  
  const handleDeposit = () => {
    const depositAmount = parseInt(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    // Add the deposit transaction
    addTransaction('deposit', depositAmount, 'Manual deposit');
    
    // Update balance
    updateBalance(depositAmount);
    
    toast.success(`${depositAmount} coins deposited successfully`);
    setAmount('');
  };
  
  const handleWithdraw = () => {
    const withdrawAmount = parseInt(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (withdrawAmount > user.balance) {
      toast.error("Insufficient balance");
      return;
    }
    
    // Add the withdrawal transaction
    addTransaction('withdrawal', -withdrawAmount, 'Manual withdrawal');
    
    // Update balance
    updateBalance(-withdrawAmount);
    
    toast.success(`${withdrawAmount} coins withdrawn successfully`);
    setAmount('');
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-game-green" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-game-red" />;
      case 'bet':
        return <Minus className="w-4 h-4 text-yellow-500" />;
      case 'win':
        return <Plus className="w-4 h-4 text-game-green" />;
      case 'referral':
        return <Plus className="w-4 h-4 text-primary" />;
      case 'signup':
        return <Plus className="w-4 h-4 text-primary" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };
  
  const getTransactionText = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'bet':
        return 'Bet Placed';
      case 'win':
        return 'Game Win';
      case 'referral':
        return 'Referral Bonus';
      case 'signup':
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
            {user.balance.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">coins</div>
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
              <span>Deposit Coins</span>
            </CardTitle>
            <CardDescription>
              Add coins to your wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button 
                className="w-full bg-game-green hover:bg-game-green/80 text-white"
                onClick={handleDeposit}
              >
                Deposit Now
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-panel" id="withdrawal-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-game-red" />
              <span>Withdraw Coins</span>
            </CardTitle>
            <CardDescription>
              Withdraw coins from your wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button 
                className="w-full bg-game-red hover:bg-game-red/80 text-white"
                onClick={handleWithdraw}
              >
                Withdraw Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>View all your transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
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
                          <div className="font-medium">{getTransactionText(transaction)}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(transaction.timestamp)}</div>
                          {transaction.description && (
                            <div className="text-xs text-muted-foreground">{transaction.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`font-bold ${transaction.amount > 0 ? 'text-game-green' : 'text-game-red'}`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)}
                        </div>
                        <div>{getStatusIcon(transaction.status)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="deposits">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Deposit History</CardTitle>
              <CardDescription>View all your deposit transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {deposits.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No deposits found
                </div>
              ) : (
                <div className="space-y-4">
                  {deposits.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-background">
                          <ArrowDownLeft className="w-4 h-4 text-game-green" />
                        </div>
                        <div>
                          <div className="font-medium">Deposit</div>
                          <div className="text-xs text-muted-foreground">{formatDate(transaction.timestamp)}</div>
                          {transaction.description && (
                            <div className="text-xs text-muted-foreground">{transaction.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-game-green">
                          +{transaction.amount.toFixed(2)}
                        </div>
                        <div>{getStatusIcon(transaction.status)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="withdrawals">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
              <CardDescription>View all your withdrawal transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No withdrawals found
                </div>
              ) : (
                <div className="space-y-4">
                  {withdrawals.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-background">
                          <ArrowUpRight className="w-4 h-4 text-game-red" />
                        </div>
                        <div>
                          <div className="font-medium">Withdrawal</div>
                          <div className="text-xs text-muted-foreground">{formatDate(transaction.timestamp)}</div>
                          {transaction.description && (
                            <div className="text-xs text-muted-foreground">{transaction.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-game-red">
                          {transaction.amount.toFixed(2)}
                        </div>
                        <div>{getStatusIcon(transaction.status)}</div>
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
