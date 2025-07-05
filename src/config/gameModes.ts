
export interface GameModeConfig {
  name: string;
  duration: number; // in seconds
  multiplier: number;
}

export const GAME_MODES: Record<string, GameModeConfig> = {
  blitz: {
    name: 'Blitz',
    duration: 30,
    multiplier: 1.2
  },
  quick: {
    name: 'Quick',
    duration: 60,
    multiplier: 1.0
  },
  classic: {
    name: 'Classic',
    duration: 180,
    multiplier: 0.9
  },
  extended: {
    name: 'Extended',
    duration: 300,
    multiplier: 0.8
  }
};

export type GameMode = keyof typeof GAME_MODES;
