
export interface GameModeConfig {
  name: string;
  duration: number; // in seconds
  multiplier: number;
}

export const GAME_MODES: Record<string, GameModeConfig> = {
  blitz: {
    name: 'Blitz',
    duration: 60, // Increased from 30 to 60 seconds
    multiplier: 1.2
  },
  quick: {
    name: 'Quick',
    duration: 180, // Increased from 60 to 180 seconds (3 minutes)
    multiplier: 1.0
  },
  classic: {
    name: 'Classic',
    duration: 300, // Increased from 180 to 300 seconds (5 minutes)
    multiplier: 0.9
  },
  extended: {
    name: 'Extended',
    duration: 600, // Increased from 300 to 600 seconds (10 minutes)
    multiplier: 0.8
  }
};

export type GameMode = keyof typeof GAME_MODES;
