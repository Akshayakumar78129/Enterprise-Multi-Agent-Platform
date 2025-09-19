import { v4 as uuidv4 } from 'uuid';

export interface Session {
  session_id: string;
  user_id: string;
  app_name: string;
  created_at: Date;
}

class SessionManager {
  private static instance: SessionManager;
  private currentSession: Session | null = null;
  private readonly STORAGE_KEY = 'ai_session';

  private constructor() {
    this.loadSession();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private loadSession(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Check if session is less than 24 hours old
          const createdAt = new Date(parsed.created_at);
          const now = new Date();
          const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

          if (hoursDiff < 24) {
            this.currentSession = parsed;
          } else {
            this.clearSession();
          }
        } catch (e) {
          console.error('Failed to load session:', e);
          this.clearSession();
        }
      }
    }
  }

  createSession(appName: string = 'orchestration_agent'): Session {
    const session: Session = {
      session_id: `session_${uuidv4()}`,
      user_id: `user_${uuidv4()}`,
      app_name: appName,
      created_at: new Date()
    };

    this.currentSession = session;
    this.saveSession();
    return session;
  }

  getOrCreateSession(appName: string = 'orchestration_agent'): Session {
    if (!this.currentSession) {
      return this.createSession(appName);
    }
    return this.currentSession;
  }

  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  private saveSession(): void {
    if (typeof window !== 'undefined' && this.currentSession) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentSession));
    }
  }

  clearSession(): void {
    this.currentSession = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  switchApp(appName: string): Session {
    // Clear current session and create new one for different app
    this.clearSession();
    return this.createSession(appName);
  }
}

export default SessionManager;