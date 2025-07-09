
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
    console.log('Saving config:', gatewayType, configData);
    
    // Check admin authentication first
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

    console.log('✅ Admin authenticated:', adminUser.email);
    
    const existingConfig = existingConfigs.find(c => c.gateway_type === gatewayType);

    let result;
    if (existingConfig) {
      console.log('Updating existing config:', existingConfig.id);
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
        console.error('Update error:', result.error);
        // Enhanced error handling for common RLS issues
        if (result.error.code === '42501' || result.error.message?.includes('permission denied')) {
          throw new Error('Permission denied: Admin authentication may have expired. Please login again.');
        }
        throw result.error;
      }
    } else {
      console.log('Creating new config');
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
        console.error('Insert error:', result.error);
        // Enhanced error handling for common RLS issues
        if (result.error.code === '42501' || result.error.message?.includes('permission denied')) {
          throw new Error('Permission denied: Admin authentication may have expired. Please login again.');
        }
        throw result.error;
      }
    }

    console.log('Save successful, updated data:', result.data);
    return result.data;
  }
}
