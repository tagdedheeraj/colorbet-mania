
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, History } from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

interface TransactionItemProps {
  transaction: Transaction;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
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

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
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
  );
};

export default TransactionItem;
