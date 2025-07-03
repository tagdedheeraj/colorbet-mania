
import { GameModeConfig } from '@/types/supabaseGame';

export const GAME_MODES: GameModeConfig[] = [
  {
    id: 'blitz',
    name: 'Blitz',
    duration: 30,
    description: 'Fast-paced 30 second rounds'
  },
  {
    id: 'quick',
    name: 'Quick',
    duration: 60,
    description: 'Standard 1 minute rounds'
  },
  {
    id: 'classic',
    name: 'Classic',
    duration: 180,
    description: 'Extended 3 minute rounds'
  },
  {
    id: 'extended',
    name: 'Extended',
    duration: 300,
    description: 'Long 5 minute strategy rounds'
  }
];
