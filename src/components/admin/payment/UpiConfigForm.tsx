
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

interface UpiConfig {
  upi_id: string;
  merchant_name: string;
}

interface UpiConfigFormProps {
  upiConfig: UpiConfig;
  setUpiConfig: (config: UpiConfig) => void;
  onSave: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

const UpiConfigForm: React.FC<UpiConfigFormProps> = ({
  upiConfig,
  setUpiConfig,
  onSave,
  isLoading,
  disabled = false
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="upi_id">UPI ID</Label>
        <Input
          id="upi_id"
          value={upiConfig.upi_id}
          onChange={(e) => setUpiConfig({...upiConfig, upi_id: e.target.value})}
          placeholder="Enter UPI ID (e.g., merchant@paytm)"
          disabled={disabled}
        />
      </div>
      <div>
        <Label htmlFor="upi_merchant">Merchant Name</Label>
        <Input
          id="upi_merchant"
          value={upiConfig.merchant_name}
          onChange={(e) => setUpiConfig({...upiConfig, merchant_name: e.target.value})}
          placeholder="Enter merchant name"
          disabled={disabled}
        />
      </div>
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
            Save UPI Configuration
          </>
        )}
      </Button>
    </div>
  );
};

export default UpiConfigForm;
