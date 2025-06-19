
// Edge Function security utilities
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface SecurityHeaders {
  'Content-Type': string;
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Strict-Transport-Security': string;
  'Content-Security-Policy': string;
}

export const getSecurityHeaders = (): SecurityHeaders => {
  return {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; object-src 'none';"
  };
};

export const validateRequestOrigin = (request: Request): boolean => {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // Allow requests from our domain and localhost for development
  const allowedOrigins = [
    'https://your-domain.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ];
  
  if (origin) {
    return allowedOrigins.some(allowed => origin.startsWith(allowed));
  }
  
  if (referer) {
    return allowedOrigins.some(allowed => referer.startsWith(allowed));
  }
  
  return false;
};

export const sanitizeErrorMessage = (error: any): string => {
  // Remove sensitive information from error messages
  const sensitivePatterns = [
    /password/gi,
    /token/gi,
    /key/gi,
    /secret/gi,
    /auth/gi,
    /database/gi,
    /connection/gi
  ];
  
  let message = error?.message || 'An error occurred';
  
  for (const pattern of sensitivePatterns) {
    message = message.replace(pattern, '[REDACTED]');
  }
  
  return message.substring(0, 100); // Limit message length
};

export const logSecurityEvent = (event: {
  type: string;
  severity: 'low' | 'medium' | 'high';
  details: string;
  userAgent?: string;
  ip?: string;
}) => {
  console.log(`[SECURITY] ${event.severity.toUpperCase()}: ${event.type}`, {
    details: event.details,
    timestamp: new Date().toISOString(),
    userAgent: event.userAgent,
    ip: event.ip
  });
};
