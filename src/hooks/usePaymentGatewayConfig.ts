
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

  // Enhanced admin authentication check
  const checkAdminAuth = async () => {
    try {
      console.log('🔍 Checking enhanced admin authentication...');
      const { authenticated, user } = await AdminAuthService.isAuthenticated();
      setIsAdminAuthenticated(authenticated);
      
      if (!authenticated) {
        console.log('⚠️ Admin not authenticated for payment config operations');
      } else {
        console.log('✅ Admin authenticated:', user?.email, 'Role:', user?.role);
      }
      
      return authenticated;
    } catch (error) {
      console.error('❌ Enhanced admin auth check failed:', error);
      setIsAdminAuthenticated(false);
      return false;
    }
  };

  const loadConfigs = async () => {
    try {
      setLoading(true);
      console.log('📥 Loading payment configurations...');
      const data = await PaymentConfigService.loadConfigs();
      setConfigs(data);

      // Reset form states first
      resetConfigs();

      // Populate form fields with existing config using type guards
      data.forEach(config => {
        console.log('🔄 Processing config:', config.gateway_type, config.config_data);
        
        if (config.gateway_type === 'upi' && isUpiConfig(config.config_data)) {
          console.log('💳 Setting UPI config:', config.config_data);
          setUpiConfig(config.config_data);
        } else if (config.gateway_type === 'qr_code' && isQrConfig(config.config_data)) {
          console.log('📱 Setting QR config:', config.config_data);
          setQrConfig(config.config_data);
        } else if (config.gateway_type === 'net_banking' && isBankConfig(config.config_data)) {
          console.log('🏦 Setting Bank config:', config.config_data);
          setBankConfig(config.config_data);
        }
      });
      
      console.log('✅ Payment configurations loaded successfully');
    } catch (error) {
      console.error('❌ Error loading configs:', error);
      toast.error('Failed to load payment configurations');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (gatewayType: ConfigType, configData: any) => {
    setSaveLoading(prev => ({ ...prev, [gatewayType]: true }));
    
    try {
      console.log('💾 Starting enhanced config save:', gatewayType);
      
      // Enhanced authentication check
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

        console.log('✅ Config saved and local state updated for:', gatewayType);
      }

      toast.success(`${gatewayType.replace('_', ' ').toUpperCase()} configuration saved successfully`);

    } catch (error) {
      console.error('❌ Enhanced error saving config:', error);
      
      // Enhanced error handling with specific messages
      if (error instanceof Error) {
        if (error.message.includes('Authentication required') || error.message.includes('Permission denied')) {
          toast.error('Authentication Error: Please login as admin first');
          setIsAdminAuthenticated(false);
          // Redirect to login after a short delay
          setTimeout(() => {
            window.location.href = '/admin-login';
          }, 2000);
        } else if (error.message.includes('session expired') || error.message.includes('Session validation failed')) {
          toast.error('Session expired: Please login again as admin');
          setIsAdminAuthenticated(false);
          // Clear local storage and redirect
          AdminAuthService.logout();
          setTimeout(() => {
            window.location.href = '/admin-login';
          }, 2000);
        } else if (error.message.includes('Database access denied')) {
          toast.error('Database Error: Admin access required');
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
    console.log('🚀 Initializing payment gateway config hook...');
    loadConfigs();
    checkAdminAuth();
  }, []);

  // Set up periodic session validation
  useEffect(() => {
    const interval = setInterval(async () => {
      if (isAdminAuthenticated) {
        const stillValid = await AdminAuthService.validateCurrentSession();
        if (!stillValid) {
          console.log('⚠️ Session expired during periodic check');
          setIsAdminAuthenticated(false);
          toast.warning('Admin session expired. Please login again.');
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isAdminAuthenticated]);

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
