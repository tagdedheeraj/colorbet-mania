
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';

interface LiveGameControlProps {
  onSetManualResult: (number: number, color: string) => void;
}

const LiveGameControl: React.FC<LiveGameControlProps> = ({ onSetManualResult }) => {
  const [manualGameMode, setManualGameMode] = useState(false);
  const [manualResult, setManualResult] = useState<{number: number | '', color: string}>({ number: '', color: '' });

  const handleSetManualResult = () => {
    if (!manualResult.number || !manualResult.color) {
      return;
    }
    onSetManualResult(Number(manualResult.number), manualResult.color);
    setManualResult({ number: '', color: '' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Live Game Control
        </CardTitle>
        <CardDescription>
          Control live games and set manual results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">Manual Game Mode</h3>
            <p className="text-sm text-muted-foreground">
              When enabled, you can set custom results for games
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
                Set the result for the current active game
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manualNumber">Number (0-9)</Label>
                  <Input
                    id="manualNumber"
                    type="number"
                    min="0"
                    max="9"
                    value={manualResult.number}
                    onChange={(e) => setManualResult({...manualResult, number: parseInt(e.target.value) || ''})}
                    placeholder="Enter number 0-9"
                  />
                </div>
                <div>
                  <Label htmlFor="manualColor">Color</Label>
                  <select
                    id="manualColor"
                    value={manualResult.color}
                    onChange={(e) => setManualResult({...manualResult, color: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select color</option>
                    <option value="red">Red</option>
                    <option value="green">Green</option>
                    <option value="violet">Violet</option>
                  </select>
                </div>
              </div>
              <Button 
                onClick={handleSetManualResult}
                className="w-full"
                disabled={!manualResult.number || !manualResult.color}
              >
                Set Manual Result
              </Button>
              <p className="text-sm text-muted-foreground">
                ⚠️ This will override the automatic result for the current game
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveGameControl;
