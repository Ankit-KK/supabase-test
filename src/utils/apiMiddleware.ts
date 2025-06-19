
// API Security Middleware
import { createSecureHeaders, validateApiResponse, sanitizeApiError } from './apiSecurity';
import { SecurityMonitor, SECURITY_EVENTS } from './securityMonitoring';
import { CSRFProtection } from './csrfProtection';

export interface SecureApiOptions {
  requireCSRF?: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  validateInput?: (data: any) => boolean;
  sanitizeOutput?: (data: any) => any;
}

export class SecureApiClient {
  private baseUrl: string;
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private checkRateLimit(endpoint: string, options: SecureApiOptions): boolean {
    if (!options.rateLimit) return true;

    const now = Date.now();
    const key = endpoint;
    const limit = this.rateLimitMap.get(key);

    if (!limit || now > limit.resetTime) {
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + options.rateLimit.windowMs,
      });
      return true;
    }

    if (limit.count >= options.rateLimit.maxRequests) {
      SecurityMonitor.logSecurityEvent({
        type: SECURITY_EVENTS.RATE_LIMIT_EXCEEDED,
        severity: 'medium',
        details: `Rate limit exceeded for endpoint: ${endpoint}`,
      });
      return false;
    }

    limit.count++;
    return true;
  }

  async secureRequest<T>(
    endpoint: string,
    options: RequestInit & SecureApiOptions = {}
  ): Promise<T> {
    // Rate limiting check
    if (!this.checkRateLimit(endpoint, options)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // CSRF protection
    if (options.requireCSRF && options.method !== 'GET') {
      const csrfToken = CSRFProtection.getToken();
      if (!csrfToken) {
        SecurityMonitor.logSecurityEvent({
          type: SECURITY_EVENTS.CSRF_FAILURE,
          severity: 'high',
          details: 'Missing CSRF token',
        });
        throw new Error('Security token missing');
      }
    }

    // Input validation
    if (options.validateInput && options.body) {
      const parsedBody = JSON.parse(options.body as string);
      if (!options.validateInput(parsedBody)) {
        SecurityMonitor.logSecurityEvent({
          type: SECURITY_EVENTS.SUSPICIOUS_REQUEST,
          severity: 'medium',
          details: 'Input validation failed',
        });
        throw new Error('Invalid input data');
      }
    }

    // Prepare secure headers
    const secureHeaders = createSecureHeaders();
    const headers = {
      ...secureHeaders,
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        const sanitizedError = sanitizeApiError(errorText);
        throw new Error(sanitizedError);
      }

      const data = await response.json();

      // Response validation
      if (!validateApiResponse(data)) {
        SecurityMonitor.logSecurityEvent({
          type: SECURITY_EVENTS.SUSPICIOUS_REQUEST,
          severity: 'high',
          details: 'Invalid API response structure',
        });
        throw new Error('Invalid response from server');
      }

      // Output sanitization
      if (options.sanitizeOutput) {
        return options.sanitizeOutput(data);
      }

      return data;
    } catch (error) {
      SecurityMonitor.logSecurityEvent({
        type: SECURITY_EVENTS.SUSPICIOUS_REQUEST,
        severity: 'low',
        details: `API request failed: ${endpoint}`,
      });
      throw error;
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, options: SecureApiOptions = {}): Promise<T> {
    return this.secureRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    data: any,
    options: SecureApiOptions = {}
  ): Promise<T> {
    return this.secureRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
      requireCSRF: true,
    });
  }

  async put<T>(
    endpoint: string,
    data: any,
    options: SecureApiOptions = {}
  ): Promise<T> {
    return this.secureRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
      requireCSRF: true,
    });
  }

  async delete<T>(endpoint: string, options: SecureApiOptions = {}): Promise<T> {
    return this.secureRequest<T>(endpoint, {
      ...options,
      method: 'DELETE',
      requireCSRF: true,
    });
  }
}

// Global secure API client instance
export const secureApiClient = new SecureApiClient();
