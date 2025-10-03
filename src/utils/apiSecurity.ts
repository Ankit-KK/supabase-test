
// API Security utilities
export const createSecureHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), autoplay=*, speaker=*',
  };
  
  // Add CSRF token if available
  const csrfToken = sessionStorage.getItem('csrf_token');
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  // Add request ID for tracking
  headers['X-Request-ID'] = crypto.randomUUID();
  
  return headers;
};

export const validateApiResponse = (response: any): boolean => {
  // Basic response validation
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  // Check for suspicious properties
  const suspiciousKeys = ['__proto__', 'constructor', 'prototype'];
  for (const key of suspiciousKeys) {
    if (key in response) {
      console.warn(`Suspicious key found in API response: ${key}`);
      return false;
    }
  }
  
  return true;
};

export const sanitizeApiError = (error: any): string => {
  // Sanitize error messages to prevent information disclosure
  if (typeof error === 'string') {
    return error.includes('password') || error.includes('token') 
      ? 'An error occurred' 
      : error.substring(0, 200);
  }
  
  if (error?.message) {
    return error.message.includes('password') || error.message.includes('token')
      ? 'An error occurred'
      : error.message.substring(0, 200);
  }
  
  return 'An unexpected error occurred';
};

// API key monitoring and rotation detection
export const monitorApiKeyUsage = (endpoint: string, responseTime: number, statusCode: number): void => {
  const usage = {
    endpoint,
    responseTime,
    statusCode,
    timestamp: Date.now(),
    userAgent: navigator.userAgent.substring(0, 100)
  };
  
  // Store recent API usage for monitoring
  const recentUsage = JSON.parse(localStorage.getItem('api_usage') || '[]');
  recentUsage.push(usage);
  
  // Keep only last 50 requests
  const filtered = recentUsage.slice(-50);
  localStorage.setItem('api_usage', JSON.stringify(filtered));
  
  // Alert on suspicious patterns
  if (responseTime > 5000 || statusCode >= 500) {
    console.warn('API performance issue detected:', usage);
  }
};

// Request size validation
export const validateRequestSize = (data: any): boolean => {
  const maxSize = 1024 * 1024; // 1MB
  const serialized = JSON.stringify(data);
  
  if (serialized.length > maxSize) {
    console.warn('Request size exceeds limit:', serialized.length);
    return false;
  }
  
  return true;
};

// Rate limiting enhancement with exponential backoff
export const calculateBackoffDelay = (attempt: number): number => {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
};
