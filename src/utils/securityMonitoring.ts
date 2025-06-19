// Security monitoring and audit utilities
export interface SecurityEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
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
} as const;
