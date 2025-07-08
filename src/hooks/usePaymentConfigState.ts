
import { useState } from 'react';
import { UpiConfig, QrConfig, BankConfig } from '@/types/paymentConfig';

export const usePaymentConfigState = () => {
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

  const resetConfigs = () => {
    setUpiConfig({ upi_id: '', merchant_name: '' });
    setQrConfig({ qr_image_url: '', merchant_name: '' });
    setBankConfig({ bank_name: '', account_number: '', ifsc: '', account_holder: '' });
  };

  return {
    upiConfig,
    setUpiConfig,
    qrConfig,
    setQrConfig,
    bankConfig,
    setBankConfig,
    resetConfigs
  };
};
