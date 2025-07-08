import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PaymentConfig, ConfigType } from '@/types/paymentConfig';
import { PaymentConfigService } from '@/services/paymentConfigService';
import { usePaymentConfigState } from '@/hooks/usePaymentConfigState';
import { isUpiConfig, isQrConfig, isBankConfig, validateConfigData } from '@/utils/paymentConfigValidators';

export const usePaymentGatewayConfig = () => {
  const [configs, setConfigs] = useState<PaymentConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState<{[key: string]: boolean}>({});
  
  const {
    upiConfig,
    setUpiConfig,
    qrConfig,
    setQrConfig,
    bankConfig,
    setBankConfig,
    resetConfigs
  } = usePaymentConfigState();

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await PaymentConfigService.loadConfigs();
      setConfigs(data);

      // Reset form states first
      resetConfigs();

      // Populate form fields with existing config using type guards
      data.forEach(config => {
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

  const saveConfig = async (gatewayType: ConfigType, configData: any) => {
    setSaveLoading(prev => ({ ...prev, [gatewayType]: true }));
    
    try {
      if (!validateConfigData(configData)) {
        toast.error('Please fill in all required fields');
        return;
      }

      const savedConfig = await PaymentConfigService.saveConfig(gatewayType, configData, configs);

      // Update local state with the exact data that was saved
      if (savedConfig) {
        // Update configs array
        setConfigs(prev => {
          const filtered = prev.filter(c => c.gateway_type !== gatewayType);
          return [...filtered, savedConfig];
        });

        // Keep the form state as is (don't reset to database values)
        // This prevents the automatic reset issue
        console.log('Keeping current form state for:', gatewayType);
      }

      toast.success(`${gatewayType.replace('_', ' ').toUpperCase()} configuration saved successfully`);

    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
      
      // On error, reload to ensure consistency
      loadConfigs();
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
