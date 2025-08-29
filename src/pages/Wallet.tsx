
import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import WalletHeader from '@/components/wallet/WalletHeader';
import WalletBalance from '@/components/wallet/WalletBalance';
import TransactionHistory from '@/components/wallet/TransactionHistory';

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
  balance_before: number;
  balance_after: number;
  reference_id?: string;
}

const Wallet: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, refreshProfile } = useSupabaseAuthStore();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
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

      // Map database transactions to WalletTransaction format
      const mappedTransactions: WalletTransaction[] = (data || []).map(transaction => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description || `${transaction.type} transaction`,
        status: 'completed', // Default status since transactions table doesn't have status
        created_at: transaction.created_at,
        balance_before: transaction.balance_before,
        balance_after: transaction.balance_after,
        reference_id: transaction.reference_id
      }));

      setTransactions(mappedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
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
        <WalletHeader />
        <WalletBalance 
          balance={profile?.balance || 0} 
          onRefresh={refreshProfile} 
        />
        <TransactionHistory transactions={transactions} />
      </div>
    </div>
  );
};

export default Wallet;
