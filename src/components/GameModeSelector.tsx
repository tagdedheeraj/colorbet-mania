
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useGameState } from '@/store/gameState';
import { Clock, Timer } from 'lucide-react';
import { GameMode } from '@/types/supabaseGame';

const GameModeSelector: React.FC = () => {
  const { currentGameMode, setCurrentGameMode, gameModesConfig } = useGameState();
  
  const handleModeChange = (value: string) => {
    if (value && (value === 'blitz' || value === 'quick' || value === 'classic' || value === 'extended')) {
      setCurrentGameMode(value as GameMode);
    }
  };
  
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else {
      const minutes = seconds / 60;
      return `${minutes}m`;
    }
  };

  return (
    <div className="glass-panel p-4 mb-4">
      <h3 className="text-sm font-medium mb-2 text-muted-foreground">Game Mode</h3>
      <ToggleGroup type="single" value={currentGameMode} onValueChange={handleModeChange} className="justify-between">
        {Object.entries(gameModesConfig).map(([modeId, mode]) => (
          <ToggleGroupItem 
            key={modeId} 
            value={modeId}
            aria-label={mode.name}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-3 flex-1 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground`}
          >
            {modeId === 'blitz' || modeId === 'quick' ? (
              <Timer className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            <span className="text-xs font-medium">{mode.name}</span>
            <span className="text-[10px]">{formatDuration(mode.duration)}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default GameModeSelector;
