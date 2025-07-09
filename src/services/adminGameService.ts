
import { GameStatsService } from './admin/gameStatsService';
import { GameModeService } from './admin/gameModeService';
import { ManualGameService } from './admin/manualGameService';
import { AdminLoggingService } from './admin/adminLoggingService';

// Re-export all the functionality from the refactored services
export class AdminGameService {
  // Game stats methods
  static getCurrentGameStats = GameStatsService.getCurrentGameStats;

  // Game mode methods
  static setGameMode = GameModeService.setGameMode;

  // Manual game methods
  static setManualResult = ManualGameService.setManualResult;
  static completeGameManually = ManualGameService.completeGameManually;

  // Logging methods
  static logAdminAction = AdminLoggingService.logAdminAction;
}

// Export individual services for direct usage if needed
export { GameStatsService } from './admin/gameStatsService';
export { GameModeService } from './admin/gameModeService';
export { ManualGameService } from './admin/manualGameService';
export { AdminLoggingService } from './admin/adminLoggingService';

// Export types
export type { LiveGameStats, DatabaseResponse } from '@/types/adminGame';
