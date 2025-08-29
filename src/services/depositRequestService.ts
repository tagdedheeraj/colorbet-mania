
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DepositRequest {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
  processed_at?: string;
  processed_by?: string;
  user?: {
    email: string;
    username: string;
  };
}

export class DepositRequestService {
  static async getAllDepositRequests(): Promise<DepositRequest[]> {
    try {
      console.log('💰 Loading all deposit requests...');

      const { data: requests, error } = await supabase
        .from('deposit_requests')
        .select(`
          *,
          users:profiles!deposit_requests_user_id_fkey(email, username)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading deposit requests:', error);
        return [];
      }

      const depositRequests: DepositRequest[] = (requests || []).map(request => ({
        id: request.id,
        user_id: request.user_id,
        amount: request.amount,
        payment_method: request.payment_method,
        transaction_id: request.transaction_id,
        status: request.status as 'pending' | 'approved' | 'rejected',
        notes: request.notes || undefined,
        created_at: request.created_at,
        processed_at: request.processed_at || undefined,
        processed_by: request.processed_by || undefined,
        user: request.users ? {
          email: request.users.email || '',
          username: request.users.username || ''
        } : undefined
      }));

      console.log('✅ Deposit requests loaded:', depositRequests.length);
      return depositRequests;

    } catch (error) {
      console.error('❌ Exception in getAllDepositRequests:', error);
      return [];
    }
  }

  static async approveDepositRequest(
    requestId: string, 
    adminUserId: string, 
    notes?: string
  ): Promise<{ success: boolean; message: string; new_balance?: number }> {
    try {
      console.log('✅ Approving deposit request:', requestId);

      // Get the deposit request
      const { data: request, error: requestError } = await supabase
        .from('deposit_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError || !request) {
        console.error('❌ Error fetching deposit request:', requestError);
        return { success: false, message: 'Deposit request not found' };
      }

      if (request.status !== 'pending') {
        return { success: false, message: 'Deposit request is not pending' };
      }

      // Get current user balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', request.user_id)
        .single();

      if (profileError || !profile) {
        console.error('❌ Error fetching user profile:', profileError);
        return { success: false, message: 'User profile not found' };
      }

      const currentBalance = profile.balance || 0;
      const newBalance = currentBalance + request.amount;

      // Update user balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', request.user_id);

      if (balanceError) {
        console.error('❌ Error updating user balance:', balanceError);
        return { success: false, message: 'Failed to update user balance' };
      }

      // Update deposit request status
      const { error: updateError } = await supabase
        .from('deposit_requests')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString(),
          processed_by: adminUserId,
          notes: notes || null
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('❌ Error updating deposit request:', updateError);
        return { success: false, message: 'Failed to update deposit request' };
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: request.user_id,
          type: 'deposit',
          amount: request.amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: `Deposit approved - ${request.payment_method} - ${request.transaction_id}`
        });

      if (transactionError) {
        console.error('❌ Error creating transaction:', transactionError);
        // Don't fail the whole operation for transaction logging
      }

      console.log('✅ Deposit request approved successfully');
      toast.success('Deposit request approved successfully');
      return { success: true, message: 'Deposit approved successfully', new_balance: newBalance };

    } catch (error) {
      console.error('❌ Exception in approveDepositRequest:', error);
      return { success: false, message: 'An error occurred while approving the deposit' };
    }
  }

  static async rejectDepositRequest(
    requestId: string, 
    adminUserId: string, 
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('❌ Rejecting deposit request:', requestId);

      // Update deposit request status
      const { error } = await supabase
        .from('deposit_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: adminUserId,
          notes: notes || null
        })
        .eq('id', requestId);

      if (error) {
        console.error('❌ Error updating deposit request:', error);
        return { success: false, message: 'Failed to reject deposit request' };
      }

      console.log('✅ Deposit request rejected successfully');
      toast.success('Deposit request rejected');
      return { success: true, message: 'Deposit rejected successfully' };

    } catch (error) {
      console.error('❌ Exception in rejectDepositRequest:', error);
      return { success: false, message: 'An error occurred while rejecting the deposit' };
    }
  }

  static async createDepositRequest(data: {
    user_id: string;
    amount: number;
    payment_method: string;
    transaction_id: string;
  }): Promise<{ success: boolean; error?: any }> {
    try {
      console.log('💰 Creating deposit request:', data);

      const { error } = await supabase
        .from('deposit_requests')
        .insert(data);

      if (error) {
        console.error('❌ Error creating deposit request:', error);
        return { success: false, error };
      }

      console.log('✅ Deposit request created successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Exception in createDepositRequest:', error);
      return { success: false, error };
    }
  }
}
