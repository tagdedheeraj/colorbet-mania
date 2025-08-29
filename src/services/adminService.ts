
import { supabase } from '@/integrations/supabase/client';
import { AdminUser, AdminBet, AdminGame } from '@/types/admin';

export class AdminService {
  static async getAllUsers(): Promise<{ data: AdminUser[]; error: any }> {
    try {
      console.log('👥 AdminService: Loading all users...');
      
      // Query profiles table instead of users table
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading users:', error);
        return { data: [], error };
      }

      // Map profiles to AdminUser format
      const users: AdminUser[] = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email || '',
        username: profile.username || '',
        role: 'user', // Default role since users table doesn't have role column
        balance: profile.balance || 0,
        created_at: profile.created_at || new Date().toISOString(),
        updated_at: profile.updated_at || new Date().toISOString()
      }));

      console.log('✅ Users loaded successfully:', users.length);
      return { data: users, error: null };

    } catch (error) {
      console.error('❌ Exception in getAllUsers:', error);
      return { data: [], error };
    }
  }

  static async getAllGames(): Promise<{ data: AdminGame[]; error: any }> {
    try {
      console.log('🎮 AdminService: Loading all games...');
      
      const { data: games, error } = await supabase
        .from('games')
        .select('*')
        .order('game_number', { ascending: false })
        .limit(100);

      if (error) {
        console.error('❌ Error loading games:', error);
        return { data: [], error };
      }

      // Map games to AdminGame format
      const adminGames: AdminGame[] = (games || []).map(game => ({
        id: game.id,
        period_number: game.game_number,
        status: game.status || 'active',
        game_mode_type: game.game_mode || 'automatic',
        result_number: game.result_number,
        result_color: game.result_color,
        created_at: game.created_at || new Date().toISOString(),
        start_time: game.start_time || new Date().toISOString(),
        end_time: game.end_time,
        game_number: game.game_number,
        game_mode: game.game_mode || 'automatic'
      }));

      console.log('✅ Games loaded successfully:', adminGames.length);
      return { data: adminGames, error: null };

    } catch (error) {
      console.error('❌ Exception in getAllGames:', error);
      return { data: [], error };
    }
  }

  static async getAllBets(): Promise<{ data: AdminBet[]; error: any }> {
    try {
      console.log('🎯 AdminService: Loading all bets...');
      
      const { data: bets, error } = await supabase
        .from('bets')
        .select(`
          *,
          profiles!inner(username, email)
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('❌ Error loading bets:', error);
        return { data: [], error };
      }

      // Map bets to AdminBet format
      const adminBets: AdminBet[] = (bets || []).map(bet => ({
        id: bet.id,
        user_id: bet.user_id,
        period_number: bet.period_number,
        bet_type: bet.bet_type as 'color' | 'number',
        bet_value: bet.bet_value,
        amount: bet.amount,
        profit: bet.profit || 0,
        status: bet.status || 'pending',
        created_at: bet.created_at || new Date().toISOString(),
        profiles: bet.profiles ? {
          username: bet.profiles.username || '',
          email: bet.profiles.email || ''
        } : undefined,
        is_winner: false, // Default value since column doesn't exist in bets table
        actual_win: bet.profit || 0
      }));

      console.log('✅ Bets loaded successfully:', adminBets.length);
      return { data: adminBets, error: null };

    } catch (error) {
      console.error('❌ Exception in getAllBets:', error);
      return { data: [], error };
    }
  }

  static async updateUserBalance(userId: string, newBalance: number): Promise<{ success: boolean; error?: any }> {
    try {
      console.log('💰 AdminService: Updating balance for user:', userId, 'to:', newBalance);

      // Update balance in profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error updating user balance:', error);
        return { success: false, error };
      }

      console.log('✅ User balance updated successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Exception in updateUserBalance:', error);
      return { success: false, error };
    }
  }

  static async getUserById(userId: string): Promise<{ data: AdminUser | null; error: any }> {
    try {
      console.log('👤 AdminService: Loading user by ID:', userId);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error loading user:', error);
        return { data: null, error };
      }

      const user: AdminUser = {
        id: profile.id,
        email: profile.email || '',
        username: profile.username || '',
        role: 'user', // Default role
        balance: profile.balance || 0,
        created_at: profile.created_at || new Date().toISOString(),
        updated_at: profile.updated_at || new Date().toISOString()
      };

      console.log('✅ User loaded successfully');
      return { data: user, error: null };

    } catch (error) {
      console.error('❌ Exception in getUserById:', error);
      return { data: null, error };
    }
  }
}
