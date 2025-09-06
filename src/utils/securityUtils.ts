
// Enhanced security utilities for input validation and sanitization
import { supabase } from '@/integrations/supabase/client';

export const validateDonationInput = (name: string, message: string, amount: number): boolean => {
  // Check for null or empty required fields
  if (!name || name.trim() === '') {
    return false;
  }
  
  // Validate name length and characters (alphanumeric, spaces, hyphens, underscores, dots only)
  if (name.length > 100 || !/^[a-zA-Z0-9\s\-_\.]+$/.test(name)) {
    return false;
  }
  
  // Validate message length
  if (message && message.length > 500) {
    return false;
  }
  
  // Validate amount
  if (!amount || amount <= 0 || amount > 100000) {
    return false;
  }
  
  // Check for potential XSS or injection attempts
  const xssPattern = /<[^>]*>|javascript:|data:|vbscript:/i;
  if (xssPattern.test(name) || (message && xssPattern.test(message))) {
    logSecurityEvent('XSS_ATTEMPT', 'Donation form XSS attempt detected');
    return false;
  }
  
  return true;
};

export const sanitizeTextInput = (input: string | null | undefined): string => {
  if (!input) {
    return '';
  }
  
  // Remove potentially dangerous characters and limit length
  return input
    .trim()
    .replace(/[<>"'&]/g, '') // Remove HTML/script injection characters
    .substring(0, 500); // Limit length
};

export const sanitizeName = (name: string | null | undefined): string => {
  if (!name) {
    return '';
  }
  
  // Only allow alphanumeric characters, spaces, hyphens, underscores, and dots
  return name
    .trim()
    .replace(/[^a-zA-Z0-9\s\-_\.]/g, '')
    .substring(0, 100);
};

export const validateAmount = (amount: number | string): boolean => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(numAmount) && numAmount > 0 && numAmount <= 100000;
};

export const getClientIP = (): string => {
  // In a real application, this would be handled server-side
  // For client-side rate limiting, we'll use a simple identifier
  return 'client-browser';
};

// Enhanced rate limiting check with server-side integration
export const checkClientRateLimit = async (endpoint: string, maxRequests: number = 5): Promise<boolean> => {
  const key = `rate_limit_${endpoint}`;
  const now = Date.now();
  const windowSize = 60000; // 1 minute
  
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify({ count: 1, timestamp: now }));
    return true;
  }
  
  const data = JSON.parse(stored);
  
  // Check if we're in a new window
  if (now - data.timestamp > windowSize) {
    localStorage.setItem(key, JSON.stringify({ count: 1, timestamp: now }));
    return true;
  }
  
  // Check if we've exceeded the limit
  if (data.count >= maxRequests) {
    await logSecurityEvent('CLIENT_RATE_LIMIT_EXCEEDED', `Endpoint: ${endpoint}`);
    return false;
  }
  
  // Increment counter
  localStorage.setItem(key, JSON.stringify({ count: data.count + 1, timestamp: data.timestamp }));
  return true;
};

// Enhanced security event logging with server-side integration
export const logSecurityEvent = async (eventType: string, details: string = ''): Promise<void> => {
  try {
    // Log to server if possible
    await supabase.rpc('log_security_violation', {
      violation_type: eventType,
      details: details,
      user_email: null
    });
  } catch (error) {
    console.warn('Failed to log security event to server:', error);
  }
  
  // Also log locally for debugging
  console.warn(`[SECURITY] ${eventType}: ${details}`);
};

// Validate email format with enhanced security
export const validateEmail = (email: string): boolean => {
  if (!email || email.length > 254) {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // Check for potential injection attempts
  const dangerousChars = /<[^>]*>|javascript:|data:|vbscript:/i;
  if (dangerousChars.test(email)) {
    logSecurityEvent('EMAIL_XSS_ATTEMPT', 'Suspicious email format detected');
    return false;
  }
  
  return true;
};

// Validate phone number with enhanced security
export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return true; // Phone is optional
  
  if (phone.length > 15) {
    return false;
  }
  
  // Allow only digits, spaces, hyphens, parentheses, and plus sign
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  if (!phoneRegex.test(phone)) {
    logSecurityEvent('INVALID_PHONE_FORMAT', 'Suspicious phone number format');
    return false;
  }
  
  return true;
};

// Content Security Policy helper
export const sanitizeForDisplay = (content: string): string => {
  if (!content) return '';
  
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Session security check
export const validateSession = (): boolean => {
  try {
    const sessionData = localStorage.getItem('supabase.auth.token');
    if (!sessionData) return false;
    
    const session = JSON.parse(sessionData);
    if (!session.expires_at) return false;
    
    const expiresAt = new Date(session.expires_at).getTime();
    const now = Date.now();
    
    if (now >= expiresAt) {
      logSecurityEvent('EXPIRED_SESSION_DETECTED', 'User session has expired');
      return false;
    }
    
    return true;
  } catch (error) {
    logSecurityEvent('SESSION_VALIDATION_ERROR', 'Failed to validate session');
    return false;
  }
};
