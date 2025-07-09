
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
      return (data || []).map(item => ({
        ...item,
        status: item.status as 'pending' | 'approved' | 'rejected'
      }));
    } catch (error) {
      console.error('❌ Exception loading deposit requests:', error);
      throw error;
    }
  }

  // Get deposit statistics
  static async getDepositStats(): Promise<DepositStats> {
    try {
      const { data, error } = await supabase.rpc('get_deposit_stats');
      
      if (error) {
        console.error('❌ Error getting deposit stats:', error);
        throw error;
      }

      // Parse the JSON response from the function
      const stats = typeof data === 'string' ? JSON.parse(data) : data;
      return {
        pending_count: stats.pending_count || 0,
        pending_amount: stats.pending_amount || 0,
        today_approved_count: stats.today_approved_count || 0,
        today_approved_amount: stats.today_approved_amount || 0
      };
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
      console.log('✅ Approving deposit request:', requestId);
      
      const adminUser = await AdminAuthService.getCurrentAdminUser();
      if (!adminUser) {
        throw new Error('Admin authentication required');
      }

      const { data, error } = await supabase.rpc('approve_deposit_request', {
        p_request_id: requestId,
        p_admin_id: adminUser.id,
        p_admin_notes: adminNotes || null
      });

      if (error) {
        console.error('❌ Error approving deposit:', error);
        throw error;
      }

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
      console.log('❌ Rejecting deposit request:', requestId);
      
      const adminUser = await AdminAuthService.getCurrentAdminUser();
      if (!adminUser) {
        throw new Error('Admin authentication required');
      }

      const { data, error } = await supabase.rpc('reject_deposit_request', {
        p_request_id: requestId,
        p_admin_id: adminUser.id,
        p_admin_notes: adminNotes
      });

      if (error) {
        console.error('❌ Error rejecting deposit:', error);
        throw error;
      }

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
