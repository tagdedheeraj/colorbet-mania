
import { supabase } from '@/integrations/supabase/client';

export interface AdminSession {
  token: string;
  admin: {
    admin_id: string;
    username: string;
    email: string;
    full_name: string;
    is_active: boolean;
  };
  expiresAt: string;
}

export class AdminAuthService {
  private static SESSION_KEY = 'admin_session';

  static getAdminSession(): AdminSession | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData) as AdminSession;
      
      // Check if session is expired
      if (new Date(session.expiresAt) < new Date()) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error getting admin session:', error);
      return null;
    }
  }

  static async verifySession(): Promise<boolean> {
    const session = this.getAdminSession();
    if (!session) return false;

    try {
      const { data, error } = await supabase.rpc('verify_admin_session', {
        p_session_token: session.token
      });

      if (error || !data || data.length === 0) {
        this.clearSession();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verifying admin session:', error);
      this.clearSession();
      return false;
    }
  }

  static async logout(): Promise<void> {
    const session = this.getAdminSession();
    
    if (session) {
      try {
        await supabase.rpc('logout_admin_session', {
          p_session_token: session.token
        });
      } catch (error) {
        console.error('Error logging out admin session:', error);
      }
    }

    this.clearSession();
  }

  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  static isAdmin(): boolean {
    const session = this.getAdminSession();
    return session !== null;
  }

  static getAdminInfo() {
    const session = this.getAdminSession();
    return session?.admin || null;
  }
}
