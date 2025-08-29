
import { supabase } from '@/integrations/supabase/client';

export class SimpleManualGameService {
  static async setManualResult(gameId: string, number: number): Promise<boolean> {
    try {
      console.log('🎯 Setting manual result (simplified):', { gameId, number });
      
      // Determine color based on number
      const getColorForNumber = (num: number): string => {
        if ([1, 3, 7, 9].includes(num)) return 'red';
        if ([2, 4, 6, 8].includes(num)) return 'green';
        if ([0, 5].includes(num)) return 'purple-red';
        return 'red';
      };

      const color = getColorForNumber(number);

      // Update game_periods with result
      const { error: updateError } = await supabase
        .from('game_periods')
        .update({
          result_number: number,
          result_color: color,
          admin_set_result_number: number,
          admin_set_result_color: color,
          status: 'completed',
          end_time: new Date().toISOString()
        })
        .eq('id', gameId);

      if (updateError) {
        console.error('❌ Error updating game result:', updateError);
        return false;
      }

      console.log('✅ Manual result set successfully');
      return true;

    } catch (error) {
      console.error('❌ Exception in setManualResult:', error);
      return false;
    }
  }
}
