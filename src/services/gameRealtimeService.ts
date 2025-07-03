
import { supabase } from '@/integrations/supabase/client';

export class GameRealtimeService {
  private static instance: GameRealtimeService;
  private channels: any[] = [];

  private constructor() {}

  public static getInstance(): GameRealtimeService {
    if (!GameRealtimeService.instance) {
      GameRealtimeService.instance = new GameRealtimeService();
    }
    return GameRealtimeService.instance;
  }

  public setupGameSubscription(onGameUpdate: () => void): void {
    console.log('Setting up game subscription...');
    
    const gameChannel = supabase
      .channel('games')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'games' },
        (payload) => {
          console.log('Game update:', payload);
          onGameUpdate();
        }
      )
      .subscribe();

    this.channels.push(gameChannel);
  }

  public setupBetSubscription(onBetUpdate: () => void): void {
    console.log('Setting up bet subscription...');
    
    const betChannel = supabase
      .channel('bets')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bets' },
        (payload) => {
          console.log('Bet update:', payload);
          onBetUpdate();
        }
      )
      .subscribe();

    this.channels.push(betChannel);
  }

  public cleanup(): void {
    this.channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.channels = [];
  }
}
