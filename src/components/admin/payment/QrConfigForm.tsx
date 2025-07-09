
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

interface QrConfig {
  qr_image_url: string;
  merchant_name: string;
}

interface QrConfigFormProps {
  qrConfig: QrConfig;
  setQrConfig: (config: QrConfig) => void;
  onSave: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

const QrConfigForm: React.FC<QrConfigFormProps> = ({
  qrConfig,
  setQrConfig,
  onSave,
  isLoading,
  disabled = false
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="qr_image_url">QR Code Image URL</Label>
        <Input
          id="qr_image_url"
          value={qrConfig.qr_image_url}
          onChange={(e) => setQrConfig({...qrConfig, qr_image_url: e.target.value})}
          placeholder="Enter QR code image URL"
          disabled={disabled}
        />
      </div>
      <div>
        <Label htmlFor="qr_merchant">Merchant Name</Label>
        <Input
          id="qr_merchant"
          value={qrConfig.merchant_name}
          onChange={(e) => setQrConfig({...qrConfig, merchant_name: e.target.value})}
          placeholder="Enter merchant name"
          disabled={disabled}
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
        onClick={onSave}
        disabled={isLoading || disabled}
        className="w-full"
      >
        {isLoading ? (
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
  );
};

export default QrConfigForm;
