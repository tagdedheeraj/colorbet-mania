
import { supabase } from '@/integrations/supabase/client';
import { PaymentConfig, ConfigType } from '@/types/paymentConfig';
import AdminAuthService from './adminAuthService';

export class PaymentConfigService {
  static async loadConfigs(): Promise<PaymentConfig[]> {
    console.log('Loading payment gateway configs...');
    
    const { data, error } = await supabase
      .from('payment_gateway_config')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading configs:', error);
      throw error;
    }

    console.log('Loaded configs:', data);
    return data || [];
  }

  static async saveConfig(gatewayType: ConfigType, configData: any, existingConfigs: PaymentConfig[]): Promise<PaymentConfig> {
    console.log('🚀 Starting enhanced config save:', gatewayType, configData);
    
    // Enhanced admin authentication check
    const isAdmin = await AdminAuthService.hasAdminRole();
    if (!isAdmin) {
      const error = new Error('Authentication required: Please login as admin to save payment configurations');
      console.error('❌ Admin authentication required for config save');
      throw error;
    }

    const adminUser = await AdminAuthService.getCurrentAdminUser();
    if (!adminUser) {
      const error = new Error('Admin session expired: Please login again');
      console.error('❌ Admin session expired');
      throw error;
    }

    console.log('✅ Enhanced admin authenticated:', adminUser.email, 'Role:', adminUser.role);
    
    // Check if we have a valid session token
    const sessionToken = AdminAuthService.getSessionToken();
    if (!sessionToken) {
      const error = new Error('No valid session token found');
      console.error('❌ No session token found');
      throw error;
    }

    // Validate current session before proceeding
    const sessionValid = await AdminAuthService.validateCurrentSession();
    if (!sessionValid) {
      const error = new Error('Session validation failed: Please login again');
      console.error('❌ Session validation failed');
      throw error;
    }

    console.log('✅ Session validation passed, proceeding with save...');
    
    const existingConfig = existingConfigs.find(c => c.gateway_type === gatewayType);

    let result;
    if (existingConfig) {
      console.log('🔄 Updating existing config:', existingConfig.id);
      result = await supabase
        .from('payment_gateway_config')
        .update({
          config_data: configData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConfig.id)
        .select()
        .single();

      if (result.error) {
        console.error('❌ Update error:', result.error);
        // Enhanced error handling for common RLS issues
        if (result.error.code === '42501' || result.error.message?.includes('permission denied')) {
          throw new Error('Permission denied: Admin authentication may have expired. Please login again.');
        }
        if (result.error.message?.includes('RLS')) {
          throw new Error('Database access denied: Please ensure you are logged in as admin.');
        }
        throw result.error;
      }
    } else {
      console.log('➕ Creating new config');
      result = await supabase
        .from('payment_gateway_config')
        .insert({
          gateway_type: gatewayType,
          config_data: configData,
          is_active: true
        })
        .select()
        .single();

      if (result.error) {
        console.error('❌ Insert error:', result.error);
        // Enhanced error handling for common RLS issues
        if (result.error.code === '42501' || result.error.message?.includes('permission denied')) {
          throw new Error('Permission denied: Admin authentication may have expired. Please login again.');
        }
        if (result.error.message?.includes('RLS')) {
          throw new Error('Database access denied: Please ensure you are logged in as admin.');
        }
        throw result.error;
      }
    }

    console.log('✅ Enhanced save successful, updated data:', result.data);
    return result.data;
  }

  // Method to get active payment configs for users
  static async getActiveConfigs(): Promise<PaymentConfig[]> {
    console.log('Loading active payment configs for users...');
    
    const { data, error } = await supabase
      .from('payment_gateway_config')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading active configs:', error);
      throw error;
    }

    console.log('Loaded active configs:', data);
    return data || [];
  }
}
