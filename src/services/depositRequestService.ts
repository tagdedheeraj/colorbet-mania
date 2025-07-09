
import { supabase } from '@/integrations/supabase/client';
import AdminAuthService from './adminAuthService';
import { toast } from 'sonner';

export interface DepositRequest {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
  users?: {
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

class DepositRequestService {
  // Load all deposit requests with user details
  static async loadDepositRequests(): Promise<DepositRequest[]> {
    try {
      console.log('🔄 Loading deposit requests...');
      
      const { data, error } = await supabase
        .from('deposit_requests')
        .select(`
          *,
          users!inner(username, email, balance)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading deposit requests:', error);
        throw error;
      }

      console.log('✅ Loaded deposit requests:', data?.length || 0);
      
      // Transform the data to match our interface
      const transformedData: DepositRequest[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        amount: item.amount,
        payment_method: item.payment_method,
        transaction_id: item.transaction_id,
        status: item.status as 'pending' | 'approved' | 'rejected',
        admin_notes: item.admin_notes || undefined,
        processed_by: item.processed_by || undefined,
        processed_at: item.processed_at || undefined,
        created_at: item.created_at,
        updated_at: item.updated_at,
        users: Array.isArray(item.users) ? item.users[0] : item.users
      }));

      console.log('🎯 Transformed data sample:', transformedData[0]);
      return transformedData;
    } catch (error) {
      console.error('❌ Exception loading deposit requests:', error);
      throw error;
    }
  }

  // Get deposit statistics using a direct query instead of RPC
  static async getDepositStats(): Promise<DepositStats> {
    try {
      console.log('📊 Loading deposit stats...');
      
      // Get pending requests
      const { data: pendingData, error: pendingError } = await supabase
        .from('deposit_requests')
        .select('amount')
        .eq('status', 'pending');

      if (pendingError) {
        console.error('❌ Error getting pending deposits:', pendingError);
        throw pendingError;
      }

      // Get today's approved requests
      const today = new Date().toISOString().split('T')[0];
      const { data: approvedData, error: approvedError } = await supabase
        .from('deposit_requests')
        .select('amount')
        .eq('status', 'approved')
        .gte('processed_at', `${today}T00:00:00.000Z`)
        .lt('processed_at', `${today}T23:59:59.999Z`);

      if (approvedError) {
        console.error('❌ Error getting approved deposits:', approvedError);
        throw approvedError;
      }

      const pendingAmount = (pendingData || []).reduce((sum, item) => sum + (item.amount || 0), 0);
      const approvedAmount = (approvedData || []).reduce((sum, item) => sum + (item.amount || 0), 0);

      const stats = {
        pending_count: (pendingData || []).length,
        pending_amount: pendingAmount,
        today_approved_count: (approvedData || []).length,
        today_approved_amount: approvedAmount
      };
      
      console.log('📊 Deposit stats:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Exception getting deposit stats:', error);
      throw error;
    }
  }

  // Approve deposit request
  static async approveDepositRequest(
    requestId: string, 
    adminNotes?: string
  ): Promise<{ success: boolean; message: string; new_balance?: number }> {
    try {
      console.log('✅ Approving deposit request:', requestId, 'with notes:', adminNotes);
      
      const adminUser = await AdminAuthService.getCurrentAdminUser();
      if (!adminUser) {
        throw new Error('Admin authentication required');
      }

      console.log('👤 Admin user verified:', adminUser.id);

      const { data, error } = await supabase.rpc('approve_deposit_request', {
        p_request_id: requestId,
        p_admin_id: adminUser.id,
        p_admin_notes: adminNotes || null
      });

      if (error) {
        console.error('❌ Error approving deposit:', error);
        throw error;
      }

      console.log('📤 RPC response:', data);

      const result = data as { success: boolean; message: string; new_balance?: number };
      
      if (result.success) {
        console.log('✅ Deposit approved successfully');
        toast.success(result.message);
      } else {
        console.error('❌ Deposit approval failed:', result.message);
        toast.error(result.message);
      }

      return result;
    } catch (error) {
      console.error('❌ Exception approving deposit:', error);
      const message = error instanceof Error ? error.message : 'Failed to approve deposit';
      toast.error(message);
      return { success: false, message };
    }
  }

  // Reject deposit request
  static async rejectDepositRequest(
    requestId: string, 
    adminNotes: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('❌ Rejecting deposit request:', requestId, 'with notes:', adminNotes);
      
      const adminUser = await AdminAuthService.getCurrentAdminUser();
      if (!adminUser) {
        throw new Error('Admin authentication required');
      }

      console.log('👤 Admin user verified:', adminUser.id);

      const { data, error } = await supabase.rpc('reject_deposit_request', {
        p_request_id: requestId,
        p_admin_id: adminUser.id,
        p_admin_notes: adminNotes
      });

      if (error) {
        console.error('❌ Error rejecting deposit:', error);
        throw error;
      }

      console.log('📤 RPC response:', data);

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        console.log('✅ Deposit rejected successfully');
        toast.success(result.message);
      } else {
        console.error('❌ Deposit rejection failed:', result.message);
        toast.error(result.message);
      }

      return result;
    } catch (error) {
      console.error('❌ Exception rejecting deposit:', error);
      const message = error instanceof Error ? error.message : 'Failed to reject deposit';
      toast.error(message);
      return { success: false, message };
    }
  }

  // Subscribe to real-time deposit request updates
  static subscribeToDepositUpdates(callback: () => void) {
    console.log('🔔 Setting up real-time deposit request subscription...');
    
    const channel = supabase
      .channel('deposit-request-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'deposit_requests'
      }, (payload) => {
        console.log('🔔 Deposit request update received:', payload);
        callback();
      })
      .subscribe();

    return channel;
  }
}

export default DepositRequestService;
