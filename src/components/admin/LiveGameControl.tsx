
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';

interface LiveGameControlProps {
  onSetManualResult: (number: number) => void;
}

const LiveGameControl: React.FC<LiveGameControlProps> = ({ onSetManualResult }) => {
  const [manualGameMode, setManualGameMode] = useState(false);
  const [manualNumber, setManualNumber] = useState<number | ''>('');

  const handleSetManualResult = () => {
    if (manualNumber === '' || manualNumber < 0 || manualNumber > 9) {
      return;
    }
    onSetManualResult(Number(manualNumber));
    setManualNumber('');
  };

  const getColorForNumber = (num: number): string => {
    if ([1, 3, 7, 9].includes(num)) return 'red';
    if ([2, 4, 6, 8].includes(num)) return 'green';
    if ([0, 5].includes(num)) return 'purple-red';
    return 'red';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Live Game Control
        </CardTitle>
        <CardDescription>
          Control live games and set manual results (number only)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">Manual Game Mode</h3>
            <p className="text-sm text-muted-foreground">
              When enabled, you can set custom number results for games
            </p>
          </div>
          <Switch
            checked={manualGameMode}
            onCheckedChange={setManualGameMode}
          />
        </div>

        {manualGameMode && (
          <Card>
            <CardHeader>
              <CardTitle>Set Manual Result</CardTitle>
              <CardDescription>
                Set the number result for the current active game (color will be auto-determined)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="manualNumber">Number (0-9)</Label>
                <Input
                  id="manualNumber"
                  type="number"
                  min="0"
                  max="9"
                  value={manualNumber}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 0 && val <= 9) {
                      setManualNumber(val);
                    } else if (e.target.value === '') {
                      setManualNumber('');
                    }
                  }}
                  placeholder="Enter number 0-9"
                  className="w-32"
                />
                
                {/* Color Preview */}
                {manualNumber !== '' && (
                  <div className="mt-2 p-2 bg-muted rounded">
                    <span className="text-sm">
                      Color will be: <span className={`px-2 py-1 rounded text-white text-xs ${
                        getColorForNumber(Number(manualNumber)) === 'red' ? 'bg-red-500' :
                        getColorForNumber(Number(manualNumber)) === 'green' ? 'bg-green-500' :
                        'bg-purple-500'
                      }`}>
                        {getColorForNumber(Number(manualNumber)) === 'purple-red' ? 'Purple-Red' : getColorForNumber(Number(manualNumber))}
                      </span>
                    </span>
                  </div>
                )}
              </div>
              
              <Button 
                onClick={handleSetManualResult}
                className="w-full"
                disabled={manualNumber === '' || manualNumber < 0 || manualNumber > 9}
              >
                Set Manual Result
              </Button>
              <p className="text-sm text-muted-foreground">
                ⚠️ This will set the number for the current game. Color will be determined automatically:
                <br />• Numbers 1,3,7,9 = Red
                <br />• Numbers 2,4,6,8 = Green  
                <br />• Numbers 0,5 = Purple-Red
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveGameControl;
