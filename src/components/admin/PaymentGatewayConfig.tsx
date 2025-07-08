
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings } from 'lucide-react';
import { usePaymentGatewayConfig } from '@/hooks/usePaymentGatewayConfig';
import UpiConfigForm from './payment/UpiConfigForm';
import QrConfigForm from './payment/QrConfigForm';
import BankConfigForm from './payment/BankConfigForm';

const PaymentGatewayConfig: React.FC = () => {
  const {
    loading,
    saveLoading,
    upiConfig,
    setUpiConfig,
    qrConfig,
    setQrConfig,
    bankConfig,
    setBankConfig,
    saveConfig
  } = usePaymentGatewayConfig();

  const handleUpiSave = () => saveConfig('upi', upiConfig);
  const handleQrSave = () => saveConfig('qr_code', qrConfig);
  const handleBankSave = () => saveConfig('net_banking', bankConfig);

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
            <UpiConfigForm
              upiConfig={upiConfig}
              setUpiConfig={setUpiConfig}
              onSave={handleUpiSave}
              isLoading={saveLoading.upi || false}
            />
          </TabsContent>

          <TabsContent value="qr_code" className="space-y-4">
            <QrConfigForm
              qrConfig={qrConfig}
              setQrConfig={setQrConfig}
              onSave={handleQrSave}
              isLoading={saveLoading.qr_code || false}
            />
          </TabsContent>

          <TabsContent value="net_banking" className="space-y-4">
            <BankConfigForm
              bankConfig={bankConfig}
              setBankConfig={setBankConfig}
              onSave={handleBankSave}
              isLoading={saveLoading.net_banking || false}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PaymentGatewayConfig;
