// Security monitoring and audit utilities
export interface SecurityEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
  metadata?: Record<string, any>;
}

export class SecurityMonitor {
  private static events: SecurityEvent[] = [];
  
  static logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
    };
    
    this.events.push(securityEvent);
    
    // Keep only last 100 events in memory
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
    
    // Log critical events to console
    if (event.severity === 'critical' || event.severity === 'high') {
      console.warn('Security Event:', securityEvent);
    }
    
    // Store in localStorage for persistence (excluding sensitive data)
    try {
      const sanitizedEvent = {
        type: event.type,
        severity: event.severity,
        timestamp: securityEvent.timestamp.toISOString(),
      };
      
      const stored = JSON.parse(localStorage.getItem('security_events') || '[]');
      stored.push(sanitizedEvent);
      
      // Keep only last 50 events in storage
      const recent = stored.slice(-50);
      localStorage.setItem('security_events', JSON.stringify(recent));
    } catch (error) {
      console.error('Failed to store security event:', error);
    }
  }
  
  static getRecentEvents(): SecurityEvent[] {
    return [...this.events];
  }
  
  static clearEvents(): void {
    this.events = [];
    localStorage.removeItem('security_events');
  }
}

// Security event types
export const SECURITY_EVENTS = {
  XSS_ATTEMPT: 'xss_attempt',
  CSRF_FAILURE: 'csrf_failure',
  INVALID_FILE_UPLOAD: 'invalid_file_upload',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SUSPICIOUS_REQUEST: 'suspicious_request',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  API_KEY_ROTATION: 'api_key_rotation',
  LARGE_REQUEST: 'large_request',
  SQL_INJECTION_ATTEMPT: 'sql_injection_attempt',
  SESSION_ANOMALY: 'session_anomaly',
  MULTIPLE_LOGIN_ATTEMPTS: 'multiple_login_attempts',
  ADMIN_ACTION: 'admin_action',
} as const;

// Enhanced monitoring with real-time alerts
export class EnhancedSecurityMonitor extends SecurityMonitor {
  private static alertThresholds = {
    critical: 1,
    high: 3,
    medium: 10,
    low: 50
  };

  static checkThresholds(): void {
    const recentEvents = this.getRecentEvents();
    const last10Minutes = Date.now() - (10 * 60 * 1000);
    
    const recentCritical = recentEvents.filter(
      e => e.timestamp.getTime() > last10Minutes && e.severity === 'critical'
    ).length;
    
    const recentHigh = recentEvents.filter(
      e => e.timestamp.getTime() > last10Minutes && e.severity === 'high'
    ).length;

    if (recentCritical >= this.alertThresholds.critical) {
      this.triggerAlert('CRITICAL', `${recentCritical} critical security events in last 10 minutes`);
    } else if (recentHigh >= this.alertThresholds.high) {
      this.triggerAlert('HIGH', `${recentHigh} high severity security events in last 10 minutes`);
    }
  }

  private static triggerAlert(level: string, message: string): void {
    console.error(`[SECURITY ALERT - ${level}] ${message}`);
    
    // Store alert for display
    const alerts = JSON.parse(localStorage.getItem('security_alerts') || '[]');
    alerts.push({
      level,
      message,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('security_alerts', JSON.stringify(alerts.slice(-10)));
  }

  static getAlerts(): Array<{level: string, message: string, timestamp: string}> {
    return JSON.parse(localStorage.getItem('security_alerts') || '[]');
  }

  static clearAlerts(): void {
    localStorage.removeItem('security_alerts');
  }
}
