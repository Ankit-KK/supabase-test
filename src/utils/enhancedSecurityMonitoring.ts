// Enhanced security monitoring with server-side integration
import { supabase } from '@/integrations/supabase/client';

export interface SecurityEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  timestamp: string;
  userAgent?: string;
  ip?: string;
  metadata?: Record<string, any>;
}

export const ENHANCED_SECURITY_EVENTS = {
  // Authentication events
  LOGIN_ATTEMPT: 'LOGIN_ATTEMPT',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  
  // Input validation events
  XSS_ATTEMPT: 'XSS_ATTEMPT',
  SQL_INJECTION_ATTEMPT: 'SQL_INJECTION_ATTEMPT',
  INVALID_INPUT: 'INVALID_INPUT',
  OVERSIZED_REQUEST: 'OVERSIZED_REQUEST',
  
  // Rate limiting events
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  CLIENT_RATE_LIMIT_EXCEEDED: 'CLIENT_RATE_LIMIT_EXCEEDED',
  
  // Data access events
  SENSITIVE_DATA_ACCESS: 'SENSITIVE_DATA_ACCESS',
  BULK_DATA_REQUEST: 'BULK_DATA_REQUEST',
  ADMIN_FUNCTION_CALLED: 'ADMIN_FUNCTION_CALLED',
  
  // File upload events
  SUSPICIOUS_FILE_UPLOAD: 'SUSPICIOUS_FILE_UPLOAD',
  FILE_SIZE_VIOLATION: 'FILE_SIZE_VIOLATION',
  
  // Business logic events
  DONATION_VALIDATION_FAILED: 'DONATION_VALIDATION_FAILED',
  PAYMENT_ANOMALY: 'PAYMENT_ANOMALY',
  MODERATOR_ACTION: 'MODERATOR_ACTION'
} as const;

export class EnhancedSecurityMonitor {
  private static events: SecurityEvent[] = [];
  private static readonly MAX_EVENTS = 100;
  private static readonly STORAGE_KEY = 'enhanced_security_events';
  private static readonly ALERTS_KEY = 'security_alerts';

  static async logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ip: 'client-side' // Will be determined server-side
    };

    // Store locally
    this.events.unshift(securityEvent);
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(0, this.MAX_EVENTS);
    }

    // Persist to localStorage
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events.slice(0, 50)));
    } catch (error) {
      console.warn('Failed to store security events locally:', error);
    }

    // Log to server if critical or high severity
    if (event.severity === 'critical' || event.severity === 'high') {
      try {
        await supabase.rpc('log_security_violation', {
          violation_type: event.type,
          details: event.details,
          user_email: null
        });
      } catch (error) {
        console.warn('Failed to log security event to server:', error);
      }
    }

    // Log to console for development
    const logLevel = event.severity === 'critical' ? 'error' : 
                    event.severity === 'high' ? 'warn' : 'info';
    console[logLevel](`[SECURITY] ${event.type}: ${event.details}`, event);

    // Check thresholds
    this.checkThresholds();
  }

  static getRecentEvents(limit: number = 20): SecurityEvent[] {
    return [...this.events].slice(0, limit);
  }

  static getEventsByType(type: string): SecurityEvent[] {
    return this.events.filter(event => event.type === type);
  }

  static getEventsBySeverity(severity: SecurityEvent['severity']): SecurityEvent[] {
    return this.events.filter(event => event.severity === severity);
  }

  static clearEvents(): void {
    this.events = [];
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private static checkThresholds(): void {
    const recentEvents = this.events.slice(0, 20);
    const criticalEvents = recentEvents.filter(e => e.severity === 'critical');
    const highEvents = recentEvents.filter(e => e.severity === 'high');

    if (criticalEvents.length >= 3) {
      this.triggerAlert('critical', `${criticalEvents.length} critical security events detected in recent activity`);
    } else if (highEvents.length >= 5) {
      this.triggerAlert('high', `${highEvents.length} high-severity security events detected`);
    }

    // Check for repeated XSS attempts
    const xssAttempts = recentEvents.filter(e => e.type === ENHANCED_SECURITY_EVENTS.XSS_ATTEMPT);
    if (xssAttempts.length >= 3) {
      this.triggerAlert('high', 'Multiple XSS attempts detected - possible attack in progress');
    }

    // Check for rate limit violations
    const rateLimitEvents = recentEvents.filter(e => 
      e.type === ENHANCED_SECURITY_EVENTS.RATE_LIMIT_EXCEEDED ||
      e.type === ENHANCED_SECURITY_EVENTS.CLIENT_RATE_LIMIT_EXCEEDED
    );
    if (rateLimitEvents.length >= 5) {
      this.triggerAlert('medium', 'Multiple rate limit violations detected');
    }
  }

  private static triggerAlert(level: string, message: string): void {
    const alert = {
      level,
      message,
      timestamp: new Date().toISOString()
    };

    console.warn(`[SECURITY ALERT] ${level.toUpperCase()}: ${message}`);

    // Store alert
    try {
      const alerts = JSON.parse(localStorage.getItem(this.ALERTS_KEY) || '[]');
      alerts.unshift(alert);
      localStorage.setItem(this.ALERTS_KEY, JSON.stringify(alerts.slice(0, 10)));
    } catch (error) {
      console.warn('Failed to store security alert:', error);
    }
  }

  static getAlerts(): Array<{level: string, message: string, timestamp: string}> {
    try {
      return JSON.parse(localStorage.getItem(this.ALERTS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  static clearAlerts(): void {
    localStorage.removeItem(this.ALERTS_KEY);
  }

  // Initialize from localStorage
  static init(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load security events from storage:', error);
      this.events = [];
    }
  }

  // Get security metrics
  static getSecurityMetrics(): {
    totalEvents: number;
    criticalEvents: number;
    highEvents: number;
    recentEvents: number;
    topEventTypes: Array<{type: string, count: number}>;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentEvents = this.events.filter(e => 
      new Date(e.timestamp) > oneHourAgo
    );

    const eventTypeCounts = this.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEventTypes = Object.entries(eventTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalEvents: this.events.length,
      criticalEvents: this.events.filter(e => e.severity === 'critical').length,
      highEvents: this.events.filter(e => e.severity === 'high').length,
      recentEvents: recentEvents.length,
      topEventTypes
    };
  }
}

// Initialize on module load
EnhancedSecurityMonitor.init();

// Export singleton instance
export const securityMonitor = EnhancedSecurityMonitor;