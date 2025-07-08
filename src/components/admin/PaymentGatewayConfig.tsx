
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Save, Settings } from 'lucide-react';

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

const PaymentGatewayConfig: React.FC = () => {
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

  useEffect(() => {
    loadConfigs();
  }, []);

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
      
      // Add timestamp to prevent caching
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
      
      // Validate config data
      if (!configData || Object.keys(configData).length === 0) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Check for empty required fields
      const hasEmptyFields = Object.values(configData).some(value => 
        !value || (typeof value === 'string' && value.trim() === '')
      );
      
      if (hasEmptyFields) {
        toast.error('Please fill in all required fields');
        return;
      }

      const existingConfig = configs.find(c => c.gateway_type === gatewayType);

      if (existingConfig) {
        // Update existing config
        console.log('Updating existing config:', existingConfig.id);
        const { data, error } = await supabase
          .from('payment_gateway_config')
          .update({
            config_data: configData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id)
          .select()
          .single();

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        
        console.log('Updated config:', data);
      } else {
        // Create new config
        console.log('Creating new config');
        const { data, error } = await supabase
          .from('payment_gateway_config')
          .insert({
            gateway_type: gatewayType,
            config_data: configData,
            is_active: true
          })
          .select()
          .single();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        
        console.log('Created config:', data);
      }

      // Update local state immediately with the saved data
      if (gatewayType === 'upi') {
        setUpiConfig(configData);
      } else if (gatewayType === 'qr_code') {
        setQrConfig(configData);
      } else if (gatewayType === 'net_banking') {
        setBankConfig(configData);
      }

      toast.success(`${gatewayType.replace('_', ' ').toUpperCase()} configuration saved successfully`);
      
      // Reload configs after a short delay to ensure database consistency
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Payment Gateway Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading payment configurations...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Payment Gateway Configuration
        </CardTitle>
        <CardDescription>
          Configure UPI, QR Code, and Net Banking payment details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upi" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upi">UPI Settings</TabsTrigger>
            <TabsTrigger value="qr_code">QR Code Settings</TabsTrigger>
            <TabsTrigger value="net_banking">Net Banking Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="upi" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="upi_id">UPI ID</Label>
                <Input
                  id="upi_id"
                  value={upiConfig.upi_id}
                  onChange={(e) => setUpiConfig({...upiConfig, upi_id: e.target.value})}
                  placeholder="Enter UPI ID (e.g., merchant@paytm)"
                />
              </div>
              <div>
                <Label htmlFor="upi_merchant">Merchant Name</Label>
                <Input
                  id="upi_merchant"
                  value={upiConfig.merchant_name}
                  onChange={(e) => setUpiConfig({...upiConfig, merchant_name: e.target.value})}
                  placeholder="Enter merchant name"
                />
              </div>
              <Button 
                onClick={() => saveConfig('upi', upiConfig)}
                disabled={saveLoading.upi}
                className="w-full"
              >
                {saveLoading.upi ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save UPI Configuration
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="qr_code" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="qr_image_url">QR Code Image URL</Label>
                <Input
                  id="qr_image_url"
                  value={qrConfig.qr_image_url}
                  onChange={(e) => setQrConfig({...qrConfig, qr_image_url: e.target.value})}
                  placeholder="Enter QR code image URL"
                />
              </div>
              <div>
                <Label htmlFor="qr_merchant">Merchant Name</Label>
                <Input
                  id="qr_merchant"
                  value={qrConfig.merchant_name}
                  onChange={(e) => setQrConfig({...qrConfig, merchant_name: e.target.value})}
                  placeholder="Enter merchant name"
                />
              </div>
              {qrConfig.qr_image_url && (
                <div className="flex justify-center">
                  <img 
                    src={qrConfig.qr_image_url} 
                    alt="QR Code Preview" 
                    className="w-32 h-32 border rounded-lg"
                    onError={() => toast.error('Invalid QR code image URL')}
                  />
                </div>
              )}
              <Button 
                onClick={() => saveConfig('qr_code', qrConfig)}
                disabled={saveLoading.qr_code}
                className="w-full"
              >
                {saveLoading.qr_code ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save QR Code Configuration
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="net_banking" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={bankConfig.bank_name}
                  onChange={(e) => setBankConfig({...bankConfig, bank_name: e.target.value})}
                  placeholder="Enter bank name"
                />
              </div>
              <div>
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={bankConfig.account_number}
                  onChange={(e) => setBankConfig({...bankConfig, account_number: e.target.value})}
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <Label htmlFor="ifsc">IFSC Code</Label>
                <Input
                  id="ifsc"
                  value={bankConfig.ifsc}
                  onChange={(e) => setBankConfig({...bankConfig, ifsc: e.target.value})}
                  placeholder="Enter IFSC code"
                />
              </div>
              <div>
                <Label htmlFor="account_holder">Account Holder Name</Label>
                <Input
                  id="account_holder"
                  value={bankConfig.account_holder}
                  onChange={(e) => setBankConfig({...bankConfig, account_holder: e.target.value})}
                  placeholder="Enter account holder name"
                />
              </div>
              <Button 
                onClick={() => saveConfig('net_banking', bankConfig)}
                disabled={saveLoading.net_banking}
                className="w-full"
              >
                {saveLoading.net_banking ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Net Banking Configuration
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PaymentGatewayConfig;
