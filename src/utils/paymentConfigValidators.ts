
import { UpiConfig, QrConfig, BankConfig } from '@/types/paymentConfig';

export const isUpiConfig = (data: any): data is UpiConfig => {
  return data && typeof data === 'object' && 'upi_id' in data && 'merchant_name' in data;
};

export const isQrConfig = (data: any): data is QrConfig => {
  return data && typeof data === 'object' && 'qr_image_url' in data && 'merchant_name' in data;
};

export const isBankConfig = (data: any): data is BankConfig => {
  return data && typeof data === 'object' && 'bank_name' in data && 'account_number' in data && 'ifsc' in data && 'account_holder' in data;
};

export const validateConfigData = (configData: any): boolean => {
  if (!configData || Object.keys(configData).length === 0) {
    return false;
  }

  const hasEmptyFields = Object.values(configData).some(value => 
    !value || (typeof value === 'string' && value.trim() === '')
  );
  
  return !hasEmptyFields;
};
