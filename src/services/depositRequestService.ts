
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DepositRequest {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  status: string;
  notes: string;
  processed_at: string;
  processed_by: string;
  created_at: string;
  // User profile data (joined)
  user?: {
    username: string;
    email: string;
    balance: number;
  };
}

export interface DepositStats {
  pending_count: number;
  pending_amount: number;
  today_approved_count: number;
  today_approved_amount: number;
}

export class DepositRequestService {
  static async loadDepositRequests(): Promise<DepositRequest[]> {
    try {
      console.log('💳 Loading deposit requests...');

      const { data, error } = await supabase
        .from('deposit_requests')
        .select(`
          *,
          profiles!deposit_requests_user_id_fkey (
            username,
            email,
            balance
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading deposit requests:', error);
        return [];
      }

      const requests = (data || []).map((request: any) => ({
        id: request.id,
        user_id: request.user_id,
        amount: request.amount,
        payment_method: request.payment_method,
        transaction_id: request.transaction_id,
        status: request.status || 'pending',
        notes: request.notes || '',
        processed_at: request.processed_at || '',
        processed_by: request.processed_by || '',
        created_at: request.created_at,
        // Map profiles to user for consistency
        user: request.profiles ? {
          username: request.profiles.username || '',
          email: request.profiles.email || '',
          balance: request.profiles.balance || 0
        } : undefined
      }));

      console.log('✅ Deposit requests loaded:', requests.length);
      return requests;

    } catch (error) {
      console.error('❌ Exception loading deposit requests:', error);
      return [];
    }
  }

  static async getDepositStats(): Promise<DepositStats> {
    try {
      console.log('📊 Loading deposit statistics...');

      // Get pending requests count and amount
      const { data: pendingData, error: pendingError } = await supabase
        .from('deposit_requests')
        .select('amount')
        .eq('status', 'pending');

      if (pendingError) {
        console.error('❌ Error loading pending deposits:', pendingError);
        return { pending_count: 0, pending_amount: 0, today_approved_count: 0, today_approved_amount: 0 };
      }

      const pendingCount = pendingData?.length || 0;
      const pendingAmount = pendingData?.reduce((sum, req) => sum + req.amount, 0) || 0;

      // Get today's approved requests
      const today = new Date().toISOString().split('T')[0];
      const { data: todayData, error: todayError } = await supabase
        .from('deposit_requests')
        .select('amount')
        .eq('status', 'approved')
        .gte('processed_at', today);

      if (todayError) {
        console.error('❌ Error loading today deposits:', todayError);
        return { pending_count: pendingCount, pending_amount: pendingAmount, today_approved_count: 0, today_approved_amount: 0 };
      }

      const todayCount = todayData?.length || 0;
      const todayAmount = todayData?.reduce((sum, req) => sum + req.amount, 0) || 0;

      const stats = {
        pending_count: pendingCount,
        pending_amount: pendingAmount,
        today_approved_count: todayCount,
        today_approved_amount: todayAmount
      };

      console.log('✅ Deposit stats loaded:', stats);
      return stats;

    } catch (error) {
      console.error('❌ Exception loading deposit stats:', error);
      return { pending_count: 0, pending_amount: 0, today_approved_count: 0, today_approved_amount: 0 };
    }
  }

  static async approveDepositRequest(
    requestId: string, 
    notes?: string
  ): Promise<{ success: boolean; message: string; new_balance?: number }> {
    try {
      console.log('✅ Approving deposit request:', requestId);

      // Get the request details
      const { data: request, error: fetchError } = await supabase
        .from('deposit_requests')
        .select('*, profiles!deposit_requests_user_id_fkey(balance)')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        console.error('❌ Error fetching request:', fetchError);
        return { success: false, message: 'Request not found' };
      }

      // Use the update_user_balance function
      const { data: balanceResult, error: balanceError } = await supabase.rpc('update_user_balance', {
        user_id_param: request.user_id,
        amount_param: request.amount,
        transaction_type_param: 'deposit',
        reference_id_param: requestId,
        description_param: `Deposit approved - ${request.payment_method}`
      });

      if (balanceError || !balanceResult) {
        console.error('❌ Balance update failed:', balanceError);
        return { success: false, message: 'Failed to update user balance' };
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('deposit_requests')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString(),
          notes: notes || 'Approved by admin'
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('❌ Request update failed:', updateError);
        return { success: false, message: 'Failed to update request status' };
      }

      console.log('✅ Deposit request approved successfully');
      toast.success('Deposit request approved successfully');
      
      return balanceResult as { success: boolean; message: string; new_balance?: number };

    } catch (error) {
      console.error('❌ Exception approving deposit:', error);
      toast.error('Failed to approve deposit request');
      return { success: false, message: 'Approval failed' };
    }
  }

  static async rejectDepositRequest(
    requestId: string, 
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('❌ Rejecting deposit request:', requestId);

      // Use the same pattern as approve but without balance update
      const { error: updateError } = await supabase
        .from('deposit_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          notes: reason
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('❌ Request update failed:', updateError);
        return { success: false, message: 'Failed to reject request' };
      }

      console.log('✅ Deposit request rejected successfully');
      toast.success('Deposit request rejected');
      
      return { success: true, message: 'Request rejected successfully' } as { success: boolean; message: string };

    } catch (error) {
      console.error('❌ Exception rejecting deposit:', error);
      toast.error('Failed to reject deposit request');
      return { success: false, message: 'Rejection failed' };
    }
  }
}
