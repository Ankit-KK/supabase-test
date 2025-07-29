// Access control and session management utilities
export interface SessionInfo {
  userId: string;
  adminType?: string;
  loginTime: number;
  lastActivity: number;
  permissions: string[];
  ipAddress?: string;
}

export class AccessControlManager {
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly ACTIVITY_TIMEOUT = 4 * 60 * 60 * 1000; // 4 hours
  private static readonly MAX_FAILED_ATTEMPTS = 5;

  // Session management
  static getSessionInfo(adminType: string): SessionInfo | null {
    try {
      const sessionData = localStorage.getItem(`session_${adminType}`);
      if (!sessionData) return null;

      const session: SessionInfo = JSON.parse(sessionData);
      
      // Check if session is expired
      if (this.isSessionExpired(session)) {
        this.clearSession(adminType);
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  static updateLastActivity(adminType: string): void {
    const session = this.getSessionInfo(adminType);
    if (session) {
      session.lastActivity = Date.now();
      localStorage.setItem(`session_${adminType}`, JSON.stringify(session));
    }
  }

  static isSessionExpired(session: SessionInfo): boolean {
    const now = Date.now();
    const sessionAge = now - session.loginTime;
    const inactivityTime = now - session.lastActivity;

    return sessionAge > this.SESSION_TIMEOUT || inactivityTime > this.ACTIVITY_TIMEOUT;
  }

  static clearSession(adminType: string): void {
    localStorage.removeItem(`session_${adminType}`);
    sessionStorage.removeItem(`${adminType}Auth`);
    sessionStorage.removeItem(`${adminType}AdminAuth`);
  }

  // Failed login attempt tracking
  static recordFailedAttempt(username: string): void {
    const key = `failed_attempts_${username}`;
    const attempts = this.getFailedAttempts(username);
    const newAttempts = attempts + 1;

    localStorage.setItem(key, JSON.stringify({
      count: newAttempts,
      lastAttempt: Date.now()
    }));

    if (newAttempts >= this.MAX_FAILED_ATTEMPTS) {
      this.lockAccount(username);
    }
  }

  static getFailedAttempts(username: string): number {
    try {
      const data = localStorage.getItem(`failed_attempts_${username}`);
      if (!data) return 0;

      const { count, lastAttempt } = JSON.parse(data);
      
      // Reset after 1 hour
      if (Date.now() - lastAttempt > 60 * 60 * 1000) {
        localStorage.removeItem(`failed_attempts_${username}`);
        return 0;
      }

      return count;
    } catch {
      return 0;
    }
  }

  static clearFailedAttempts(username: string): void {
    localStorage.removeItem(`failed_attempts_${username}`);
    localStorage.removeItem(`locked_${username}`);
  }

  static isAccountLocked(username: string): boolean {
    try {
      const lockData = localStorage.getItem(`locked_${username}`);
      if (!lockData) return false;

      const { lockedAt } = JSON.parse(lockData);
      const lockDuration = 30 * 60 * 1000; // 30 minutes

      if (Date.now() - lockedAt > lockDuration) {
        this.clearFailedAttempts(username);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  private static lockAccount(username: string): void {
    localStorage.setItem(`locked_${username}`, JSON.stringify({
      lockedAt: Date.now(),
      reason: 'Too many failed login attempts'
    }));
  }

  // Permission checking
  static hasPermission(adminType: string, permission: string): boolean {
    const session = this.getSessionInfo(adminType);
    if (!session) return false;

    return session.permissions.includes(permission) || 
           session.permissions.includes('admin') ||
           adminType === 'admin';
  }

  // Admin action logging
  static logAdminAction(adminType: string, action: string, details?: string): void {
    const logEntry = {
      adminType,
      action,
      details,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionInfo(adminType)?.userId || 'unknown'
    };

    const logs = JSON.parse(localStorage.getItem('admin_action_logs') || '[]');
    logs.push(logEntry);

    // Keep only last 100 admin actions
    localStorage.setItem('admin_action_logs', JSON.stringify(logs.slice(-100)));
  }

  static getAdminActionLogs(): any[] {
    return JSON.parse(localStorage.getItem('admin_action_logs') || '[]');
  }

  // Session monitoring
  static startSessionMonitoring(): void {
    setInterval(() => {
      this.checkAllSessions();
    }, 60000); // Check every minute
  }

  private static checkAllSessions(): void {
    const adminTypes = ['ankit', 'chiaa_gaming', 'admin'];
    
    adminTypes.forEach(adminType => {
      const session = this.getSessionInfo(adminType);
      if (session && this.isSessionExpired(session)) {
        console.warn(`Session expired for ${adminType}, clearing session`);
        this.clearSession(adminType);
        
        // Trigger event for UI to handle
        window.dispatchEvent(new CustomEvent('sessionExpired', { 
          detail: { adminType } 
        }));
      }
    });
  }
}

// Initialize session monitoring on module load
if (typeof window !== 'undefined') {
  AccessControlManager.startSessionMonitoring();
}
