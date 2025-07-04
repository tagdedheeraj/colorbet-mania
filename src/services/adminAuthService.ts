
export interface AdminSession {
  isAdmin: boolean;
  username: string;
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
    return session !== null && session.isAdmin;
  }

  static async logout(): Promise<void> {
    this.clearSession();
  }

  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  static isAdmin(): boolean {
    const session = this.getAdminSession();
    return session !== null && session.isAdmin;
  }

  static getAdminInfo() {
    const session = this.getAdminSession();
    return session ? { username: session.username } : null;
  }
}
