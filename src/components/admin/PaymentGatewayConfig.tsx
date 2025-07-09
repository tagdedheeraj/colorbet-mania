
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, AlertCircle, Shield } from 'lucide-react';
import { usePaymentGatewayConfig } from '@/hooks/usePaymentGatewayConfig';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import UpiConfigForm from './payment/UpiConfigForm';
import QrConfigForm from './payment/QrConfigForm';
import BankConfigForm from './payment/BankConfigForm';

const PaymentGatewayConfig: React.FC = () => {
  const navigate = useNavigate();
  const {
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
    checkAdminAuth
  } = usePaymentGatewayConfig();

  const handleUpiSave = () => saveConfig('upi', upiConfig);
  const handleQrSave = () => saveConfig('qr_code', qrConfig);
  const handleBankSave = () => saveConfig('net_banking', bankConfig);

  const handleLoginRedirect = () => {
    navigate('/admin-login');
  };

  const handleRefreshAuth = async () => {
    await checkAdminAuth();
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
        {!isAdminAuthenticated && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>You need to be logged in as admin to save payment configurations.</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefreshAuth}
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Check Auth
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleLoginRedirect}
                >
                  Admin Login
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

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
              disabled={!isAdminAuthenticated}
            />
          </TabsContent>

          <TabsContent value="qr_code" className="space-y-4">
            <QrConfigForm
              qrConfig={qrConfig}
              setQrConfig={setQrConfig}
              onSave={handleQrSave}
              isLoading={saveLoading.qr_code || false}
              disabled={!isAdminAuthenticated}
            />
          </TabsContent>

          <TabsContent value="net_banking" className="space-y-4">
            <BankConfigForm
              bankConfig={bankConfig}
              setBankConfig={setBankConfig}
              onSave={handleBankSave}
              isLoading={saveLoading.net_banking || false}
              disabled={!isAdminAuthenticated}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PaymentGatewayConfig;
