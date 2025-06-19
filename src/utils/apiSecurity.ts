
// API Security utilities
export const createSecureHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  };
  
  // Add CSRF token if available
  const csrfToken = sessionStorage.getItem('csrf_token');
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
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
