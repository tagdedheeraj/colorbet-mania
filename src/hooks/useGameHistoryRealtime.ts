
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BetHistoryService } from '@/services/betHistoryService';
import useSupabaseAuthStore from '@/store/supabaseAuthStore';

export const useGameHistoryRealtime = (
  onGameResultUpdate: () => void,
  onBetUpdate: () => void
) => {
  const { user } = useSupabaseAuthStore();

  const setupRealtimeSubscriptions = useCallback(() => {
    if (!user) return;

    console.log('🔄 Setting up real-time subscriptions for game history...');

    // Subscribe to game completions
    const gameChannel = supabase
      .channel('game_completions')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: 'status=eq.completed'
        },
        (payload) => {
          console.log('🎮 Game completed:', payload);
          // Delay slightly to ensure bet processing is complete
          setTimeout(() => {
            onGameResultUpdate();
          }, 1000);
        }
      )
      .subscribe();

    // Subscribe to bet updates for the current user
    const betChannel = supabase
      .channel('user_bet_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bets',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('💰 Bet updated:', payload);
          onBetUpdate();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up real-time subscriptions...');
      supabase.removeChannel(gameChannel);
      supabase.removeChannel(betChannel);
    };
  }, [user, onGameResultUpdate, onBetUpdate]);

  useEffect(() => {
    const cleanup = setupRealtimeSubscriptions();
    return cleanup;
  }, [setupRealtimeSubscriptions]);
};
