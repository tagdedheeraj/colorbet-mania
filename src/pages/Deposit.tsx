
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Smartphone, QrCode, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { supabase } from '@/integrations/supabase/client';
import { UserSyncService } from '@/services/userSyncService';

interface PaymentConfig {
  id: string;
  gateway_type: string;
  config_data: any;
  is_active: boolean;
}

const Deposit: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSupabaseAuthStore();
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('upi');
  const [transactionId, setTransactionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfig[]>([]);
  const [userValidated, setUserValidated] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    loadPaymentConfigs();
    validateUser();
  }, [isAuthenticated, navigate, user]);

  const validateUser = async () => {
    if (!user) {
      toast.error('User not found. Please log in again.');
      navigate('/auth');
      return;
    }

    console.log('Validating user for deposit:', user.id);
    const validation = await UserSyncService.validateUserForDeposit(user.id);
    
    if (!validation.valid) {
      toast.error(validation.message || 'User validation failed');
      if (validation.message?.includes('log out and log in again')) {
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      }
      return;
    }

    setUserValidated(true);
    console.log('User validated successfully for deposit');
  };

  const loadPaymentConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_gateway_config')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error loading payment configs:', error);
        return;
      }

      setPaymentConfigs(data || []);
    } catch (error) {
      console.error('Error loading payment configs:', error);
    }
  };

  const getPaymentConfig = (type: string) => {
    return paymentConfigs.find(config => config.gateway_type === type)?.config_data;
  };

  const validateForm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return false;
    }

    if (parseFloat(amount) < 10) {
      toast.error('Minimum deposit amount is ₹10');
      return false;
    }

    if (!transactionId.trim()) {
      toast.error('Please enter transaction ID');
      return false;
    }

    if (transactionId.trim().length < 5) {
      toast.error('Transaction ID must be at least 5 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userValidated) {
      toast.error('User validation pending. Please wait or refresh the page.');
      return;
    }

    if (!validateForm()) return;

    if (!user) {
      toast.error('Authentication error. Please log out and log in again.');
      return;
    }

    setLoading(true);

    try {
      console.log('Submitting deposit request for user:', user.id);
      
      // Double check user exists before submission
      const validation = await UserSyncService.validateUserForDeposit(user.id);
      if (!validation.valid) {
        toast.error(validation.message || 'User validation failed');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('deposit_requests')
        .insert({
          user_id: user.id,
          amount: parseFloat(amount),
          payment_method: paymentMethod,
          transaction_id: transactionId.trim(),
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Deposit submission error:', error);
        
        // Provide specific error messages based on error type
        if (error.code === '23503') {
          toast.error('Authentication error. Please log out and log in again.');
        } else if (error.message.includes('duplicate')) {
          toast.error('This transaction ID has already been used. Please use a different transaction ID.');
        } else {
          toast.error('Failed to submit deposit request. Please try again.');
        }
        return;
      }

      console.log('Deposit request submitted successfully:', data);
      toast.success('Deposit request submitted successfully! It will be reviewed by our team.');
      
      // Reset form
      setAmount('');
      setTransactionId('');
      
      // Navigate to wallet page
      setTimeout(() => {
        navigate('/wallet');
      }, 2000);

    } catch (error) {
      console.error('Unexpected error during deposit submission:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const upiConfig = getPaymentConfig('upi');
  const qrConfig = getPaymentConfig('qr_code');
  const bankConfig = getPaymentConfig('net_banking');

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
      <div className="container mx-auto px-4 py-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/wallet')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Add Funds</h1>
        </div>

        {!userValidated && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Validating user account...</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Deposit Funds
              </CardTitle>
              <CardDescription>
                Choose your preferred payment method and submit payment details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount (minimum ₹10)"
                    min="10"
                    step="0.01"
                    required
                    disabled={loading || !userValidated}
                  />
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-4">
                  <Label>Payment Method</Label>
                  <RadioGroup 
                    value={paymentMethod} 
                    onValueChange={setPaymentMethod}
                    disabled={loading || !userValidated}
                  >
                    {/* UPI Option */}
                    {upiConfig && (
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="upi" id="upi" />
                        <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer">
                          <Smartphone className="h-4 w-4" />
                          UPI Payment
                        </Label>
                      </div>
                    )}

                    {/* QR Code Option */}
                    {qrConfig && (
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="qr_code" id="qr_code" />
                        <Label htmlFor="qr_code" className="flex items-center gap-2 cursor-pointer">
                          <QrCode className="h-4 w-4" />
                          QR Code Payment
                        </Label>
                      </div>
                    )}

                    {/* Net Banking Option */}
                    {bankConfig && (
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="net_banking" id="net_banking" />
                        <Label htmlFor="net_banking" className="flex items-center gap-2 cursor-pointer">
                          <Building2 className="h-4 w-4" />
                          Net Banking
                        </Label>
                      </div>
                    )}
                  </RadioGroup>
                </div>

                {/* Payment Instructions */}
                <Tabs value={paymentMethod} className="w-full">
                  {/* UPI Instructions */}
                  {upiConfig && (
                    <TabsContent value="upi">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">UPI Payment Instructions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label>UPI ID</Label>
                            <div className="p-3 bg-muted rounded-md font-mono text-sm">
                              {upiConfig.upi_id}
                            </div>
                          </div>
                          <div>
                            <Label>Merchant Name</Label>
                            <div className="p-3 bg-muted rounded-md">
                              {upiConfig.merchant_name}
                            </div>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-md">
                            <p className="text-sm text-blue-800">
                              1. Send payment to the above UPI ID<br/>
                              2. Copy the transaction ID from your payment app<br/>
                              3. Enter the transaction ID below and submit
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}

                  {/* QR Code Instructions */}
                  {qrConfig && (
                    <TabsContent value="qr_code">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">QR Code Payment Instructions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-center">
                            <img 
                              src={qrConfig.qr_image_url} 
                              alt="Payment QR Code" 
                              className="w-48 h-48 border rounded-lg"
                            />
                          </div>
                          <div>
                            <Label>Merchant Name</Label>
                            <div className="p-3 bg-muted rounded-md">
                              {qrConfig.merchant_name}
                            </div>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-md">
                            <p className="text-sm text-blue-800">
                              1. Scan the QR code with your payment app<br/>
                              2. Enter the amount and complete payment<br/>
                              3. Copy the transaction ID<br/>
                              4. Enter the transaction ID below and submit
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}

                  {/* Net Banking Instructions */}
                  {bankConfig && (
                    <TabsContent value="net_banking">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Net Banking Instructions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Bank Name</Label>
                              <div className="p-3 bg-muted rounded-md">
                                {bankConfig.bank_name}
                              </div>
                            </div>
                            <div>
                              <Label>Account Number</Label>
                              <div className="p-3 bg-muted rounded-md font-mono">
                                {bankConfig.account_number}
                              </div>
                            </div>
                            <div>
                              <Label>IFSC Code</Label>
                              <div className="p-3 bg-muted rounded-md font-mono">
                                {bankConfig.ifsc}
                              </div>
                            </div>
                            <div>
                              <Label>Account Holder</Label>
                              <div className="p-3 bg-muted rounded-md">
                                {bankConfig.account_holder}
                              </div>
                            </div>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-md">
                            <p className="text-sm text-blue-800">
                              1. Transfer money to the above bank account<br/>
                              2. Use your registered name as reference<br/>
                              3. Copy the transaction/reference ID from your bank<br/>
                              4. Enter the transaction ID below and submit
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}
                </Tabs>

                {/* Transaction ID Input */}
                <div className="space-y-2">
                  <Label htmlFor="transactionId">Transaction ID / Reference Number</Label>
                  <Input
                    id="transactionId"
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID from your payment"
                    required
                    disabled={loading || !userValidated}
                    minLength={5}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter the transaction ID you received after making the payment
                  </p>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !userValidated}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Deposit Request'
                  )}
                </Button>

                <div className="bg-yellow-50 p-4 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Your deposit will be processed manually by our team. 
                    Please ensure you've completed the payment before submitting this form. 
                    Processing may take up to 24 hours.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Deposit;
