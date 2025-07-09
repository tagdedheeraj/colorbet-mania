
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PaymentConfig, ConfigType } from '@/types/paymentConfig';
import { PaymentConfigService } from '@/services/paymentConfigService';
import { usePaymentConfigState } from '@/hooks/usePaymentConfigState';
import { isUpiConfig, isQrConfig, isBankConfig, validateConfigData } from '@/utils/paymentConfigValidators';
import AdminAuthService from '@/services/adminAuthService';

export const usePaymentGatewayConfig = () => {
  const [configs, setConfigs] = useState<PaymentConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState<{[key: string]: boolean}>({});
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  
  const {
    upiConfig,
    setUpiConfig,
    qrConfig,
    setQrConfig,
    bankConfig,
    setBankConfig,
    resetConfigs
  } = usePaymentConfigState();

  // Check admin authentication status
  const checkAdminAuth = async () => {
    try {
      const { authenticated } = await AdminAuthService.isAuthenticated();
      setIsAdminAuthenticated(authenticated);
      
      if (!authenticated) {
        console.log('⚠️ Admin not authenticated for payment config operations');
      }
      
      return authenticated;
    } catch (error) {
      console.error('Admin auth check failed:', error);
      setIsAdminAuthenticated(false);
      return false;
    }
  };

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
      // First check admin authentication
      const isAuthenticated = await checkAdminAuth();
      if (!isAuthenticated) {
        toast.error('Please login as admin to save payment configurations');
        return;
      }

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
      
      // Enhanced error handling
      if (error instanceof Error) {
        if (error.message.includes('Authentication required') || error.message.includes('Permission denied')) {
          toast.error('Authentication Error: Please login as admin first');
          setIsAdminAuthenticated(false);
        } else if (error.message.includes('session expired')) {
          toast.error('Session expired: Please login again as admin');
          setIsAdminAuthenticated(false);
        } else {
          toast.error(`Failed to save configuration: ${error.message}`);
        }
      } else {
        toast.error('Failed to save configuration');
      }
      
      // On error, reload to ensure consistency
      loadConfigs();
    } finally {
      setSaveLoading(prev => ({ ...prev, [gatewayType]: false }));
    }
  };

  useEffect(() => {
    loadConfigs();
    checkAdminAuth();
  }, []);

  return {
    configs,
    loading,
    saveLoading,
    isAdminAuthenticated,
    upiConfig,
    setUpiConfig,
    qrConfig,
    setQrConfig,
    bankConfig,
    setBankConfig,
    saveConfig,
    loadConfigs,
    checkAdminAuth
  };
};
