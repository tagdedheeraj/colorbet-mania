
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentConfig {
  id: string;
  gateway_type: string;
  config_data: any;
  is_active: boolean;
}

interface UpiConfig {
  upi_id: string;
  merchant_name: string;
}

interface QrConfig {
  qr_image_url: string;
  merchant_name: string;
}

interface BankConfig {
  bank_name: string;
  account_number: string;
  ifsc: string;
  account_holder: string;
}

export const usePaymentGatewayConfig = () => {
  const [configs, setConfigs] = useState<PaymentConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState<{[key: string]: boolean}>({});
  
  const [upiConfig, setUpiConfig] = useState<UpiConfig>({
    upi_id: '',
    merchant_name: ''
  });
  const [qrConfig, setQrConfig] = useState<QrConfig>({
    qr_image_url: '',
    merchant_name: ''
  });
  const [bankConfig, setBankConfig] = useState<BankConfig>({
    bank_name: '',
    account_number: '',
    ifsc: '',
    account_holder: ''
  });

  const isUpiConfig = (data: any): data is UpiConfig => {
    return data && typeof data === 'object' && 'upi_id' in data && 'merchant_name' in data;
  };

  const isQrConfig = (data: any): data is QrConfig => {
    return data && typeof data === 'object' && 'qr_image_url' in data && 'merchant_name' in data;
  };

  const isBankConfig = (data: any): data is BankConfig => {
    return data && typeof data === 'object' && 'bank_name' in data && 'account_number' in data && 'ifsc' in data && 'account_holder' in data;
  };

  const loadConfigs = async () => {
    try {
      setLoading(true);
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
      setConfigs(data || []);

      // Reset form states first
      setUpiConfig({ upi_id: '', merchant_name: '' });
      setQrConfig({ qr_image_url: '', merchant_name: '' });
      setBankConfig({ bank_name: '', account_number: '', ifsc: '', account_holder: '' });

      // Populate form fields with existing config using type guards
      data?.forEach(config => {
        console.log('Processing config:', config.gateway_type, config.config_data);
        
        if (config.gateway_type === 'upi' && isUpiConfig(config.config_data)) {
          console.log('Setting UPI config:', config.config_data);
          setUpiConfig(config.config_data);
        } else if (config.gateway_type === 'qr_code' && isQrConfig(config.config_data)) {
          console.log('Setting QR config:', config.config_data);
          setQrConfig(config.config_data);
        } else if (config.gateway_type === 'net_banking' && isBankConfig(config.config_data)) {
          console.log('Setting Bank config:', config.config_data);
          setBankConfig(config.config_data);
        }
      });
    } catch (error) {
      console.error('Error loading configs:', error);
      toast.error('Failed to load payment configurations');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (gatewayType: string, configData: any) => {
    setSaveLoading(prev => ({ ...prev, [gatewayType]: true }));
    
    try {
      console.log('Saving config:', gatewayType, configData);
      
      if (!configData || Object.keys(configData).length === 0) {
        toast.error('Please fill in all required fields');
        return;
      }

      const hasEmptyFields = Object.values(configData).some(value => 
        !value || (typeof value === 'string' && value.trim() === '')
      );
      
      if (hasEmptyFields) {
        toast.error('Please fill in all required fields');
        return;
      }

      const existingConfig = configs.find(c => c.gateway_type === gatewayType);

      if (existingConfig) {
        console.log('Updating existing config:', existingConfig.id);
        const { error } = await supabase
          .from('payment_gateway_config')
          .update({
            config_data: configData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
      } else {
        console.log('Creating new config');
        const { error } = await supabase
          .from('payment_gateway_config')
          .insert({
            gateway_type: gatewayType,
            config_data: configData,
            is_active: true
          });

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
      }

      // Update local state immediately
      if (gatewayType === 'upi') {
        setUpiConfig(configData);
      } else if (gatewayType === 'qr_code') {
        setQrConfig(configData);
      } else if (gatewayType === 'net_banking') {
        setBankConfig(configData);
      }

      toast.success(`${gatewayType.replace('_', ' ').toUpperCase()} configuration saved successfully`);
      
      // Reload configs to ensure consistency
      setTimeout(() => {
        loadConfigs();
      }, 500);

    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaveLoading(prev => ({ ...prev, [gatewayType]: false }));
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  return {
    configs,
    loading,
    saveLoading,
    upiConfig,
    setUpiConfig,
    qrConfig,
    setQrConfig,
    bankConfig,
    setBankConfig,
    saveConfig,
    loadConfigs
  };
};
