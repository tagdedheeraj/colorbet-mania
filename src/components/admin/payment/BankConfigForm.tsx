
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

interface BankConfig {
  bank_name: string;
  account_number: string;
  ifsc: string;
  account_holder: string;
}

interface BankConfigFormProps {
  bankConfig: BankConfig;
  setBankConfig: (config: BankConfig) => void;
  onSave: () => void;
  isLoading: boolean;
}

const BankConfigForm: React.FC<BankConfigFormProps> = ({
  bankConfig,
  setBankConfig,
  onSave,
  isLoading
}) => {
  return (
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
        onClick={onSave}
        disabled={isLoading}
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
            Save Net Banking Configuration
          </>
        )}
      </Button>
    </div>
  );
};

export default BankConfigForm;
