
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Smartphone, QrCode, Building2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';
import { supabase } from '@/integrations/supabase/client';

interface PaymentConfig {
  gateway_type: string;
  config_data: any;
}

interface DepositRequest {
  id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  status: string;
  created_at: string;
}

const Deposit: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isInitialized } = useSupabaseAuthStore();
  const [amount, setAmount] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('upi');
  const [loading, setLoading] = useState(false);
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfig[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);

  useEffect(() => {
    // Wait for auth to be initialized before checking
    if (!isInitialized) return;
    
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    loadPaymentConfigs();
    loadDepositRequests();
  }, [isAuthenticated, isInitialized, navigate]);

  const loadPaymentConfigs = async () => {
    try {
      console.log('Loading payment configs...');
      const { data, error } = await supabase
        .from('payment_gateway_config')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error loading payment configs:', error);
        throw error;
      }
      
      console.log('Payment configs loaded:', data);
      setPaymentConfigs(data || []);
    } catch (error) {
      console.error('Error loading payment configs:', error);
      toast.error('Failed to load payment options');
    }
  };

  const loadDepositRequests = async () => {
    if (!user) {
      console.log('No user found, skipping deposit requests load');
      return;
    }

    try {
      console.log('Loading deposit requests for user:', user.id);
      const { data, error } = await supabase
        .from('deposit_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading deposit requests:', error);
        throw error;
      }
      
      console.log('Deposit requests loaded:', data);
      setDepositRequests(data || []);
    } catch (error) {
      console.error('Error loading deposit requests:', error);
      toast.error('Failed to load deposit history');
    }
  };

  const handleSubmitDeposit = async () => {
    console.log('Submitting deposit request...');
    console.log('User:', user);
    console.log('Amount:', amount);
    console.log('Transaction ID:', transactionId);
    
    // Validation checks
    if (!user) {
      console.error('No user found');
      toast.error('Please log in to submit deposit request');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      console.error('Invalid amount');
      toast.error('Please enter a valid amount');
      return;
    }

    if (!transactionId.trim()) {
      console.error('No transaction ID');
      toast.error('Please enter transaction ID');
      return;
    }

    setLoading(true);
    try {
      console.log('Inserting deposit request...');
      const depositData = {
        user_id: user.id,
        amount: parseFloat(amount),
        payment_method: selectedMethod,
        transaction_id: transactionId.trim(),
        status: 'pending'
      };
      
      console.log('Deposit data:', depositData);
      
      const { data, error } = await supabase
        .from('deposit_requests')
        .insert(depositData)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Deposit request created:', data);
      toast.success('Deposit request submitted successfully! Admin will review it shortly.');
      
      // Reset form
      setAmount('');
      setTransactionId('');
      
      // Reload deposit requests
      await loadDepositRequests();
      
    } catch (error) {
      console.error('Error submitting deposit:', error);
      
      // More specific error messages
      if (error.message?.includes('foreign key')) {
        toast.error('Authentication error. Please log out and log in again.');
      } else if (error.message?.includes('violates row-level security')) {
        toast.error('Permission denied. Please ensure you are logged in.');
      } else {
        toast.error(`Failed to submit deposit request: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPaymentConfig = (type: string) => {
    return paymentConfigs.find(config => config.gateway_type === type)?.config_data;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN');
  };

  // Don't render until auth is initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const upiConfig = getPaymentConfig('upi');
  const qrConfig = getPaymentConfig('qr_code');
  const bankConfig = getPaymentConfig('net_banking');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/wallet')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Wallet
          </Button>
          <h1 className="text-3xl font-bold">Add Funds</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deposit Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Deposit Funds
                </CardTitle>
                <CardDescription>
                  Choose your payment method and add funds to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    step="1"
                  />
                </div>

                <Tabs value={selectedMethod} onValueChange={setSelectedMethod}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="upi" className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      UPI
                    </TabsTrigger>
                    <TabsTrigger value="qr_code" className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      QR Code
                    </TabsTrigger>
                    <TabsTrigger value="net_banking" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Net Banking
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upi" className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">UPI Payment Details</h3>
                        {upiConfig ? (
                          <div className="space-y-2">
                            <p><strong>UPI ID:</strong> {upiConfig.upi_id}</p>
                            <p><strong>Merchant:</strong> {upiConfig.merchant_name}</p>
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-800">
                                📱 Send ₹{amount || 'X'} to <strong>{upiConfig.upi_id}</strong> and enter the transaction ID below
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">UPI payment details not configured</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="qr_code" className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">QR Code Payment</h3>
                        {qrConfig ? (
                          <div className="space-y-2">
                            <div className="flex justify-center">
                              <img 
                                src={qrConfig.qr_image_url} 
                                alt="Payment QR Code" 
                                className="w-48 h-48 border rounded-lg"
                              />
                            </div>
                            <p className="text-center"><strong>Merchant:</strong> {qrConfig.merchant_name}</p>
                            <div className="p-3 bg-green-50 rounded-lg">
                              <p className="text-sm text-green-800">
                                📱 Scan the QR code, pay ₹{amount || 'X'} and enter the transaction ID below
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">QR code payment details not configured</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="net_banking" className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">Bank Transfer Details</h3>
                        {bankConfig ? (
                          <div className="space-y-2">
                            <p><strong>Bank:</strong> {bankConfig.bank_name}</p>
                            <p><strong>Account Number:</strong> {bankConfig.account_number}</p>
                            <p><strong>IFSC Code:</strong> {bankConfig.ifsc}</p>
                            <p><strong>Account Holder:</strong> {bankConfig.account_holder}</p>
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <p className="text-sm text-purple-800">
                                🏦 Transfer ₹{amount || 'X'} to the above account and enter the transaction ID below
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">Net banking details not configured</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <div>
                  <Label htmlFor="transactionId">Transaction ID</Label>
                  <Input
                    id="transactionId"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID from your payment app"
                  />
                </div>

                <Button 
                  onClick={handleSubmitDeposit}
                  disabled={loading || !user}
                  className="w-full"
                >
                  {loading ? 'Submitting...' : 'Submit Deposit Request'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Deposit History */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Deposit Requests</CardTitle>
                <CardDescription>
                  Track your deposit request status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {depositRequests.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No deposit requests yet
                    </p>
                  ) : (
                    depositRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(request.status)}
                          <div>
                            <p className="font-medium">₹{request.amount}</p>
                            <p className="text-sm text-muted-foreground">
                              {request.payment_method.replace('_', ' ').toUpperCase()} • {request.transaction_id}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(request.created_at)}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={
                            request.status === 'approved' ? 'default' : 
                            request.status === 'rejected' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deposit;
