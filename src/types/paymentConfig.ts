
export interface PaymentConfig {
  id: string;
  gateway_type: string;
  config_data: any;
  is_active: boolean;
}

export interface UpiConfig {
  upi_id: string;
  merchant_name: string;
}

export interface QrConfig {
  qr_image_url: string;
  merchant_name: string;
}

export interface BankConfig {
  bank_name: string;
  account_number: string;
  ifsc: string;
  account_holder: string;
}

export type ConfigType = 'upi' | 'qr_code' | 'net_banking';
