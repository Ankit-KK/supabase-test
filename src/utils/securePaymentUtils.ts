
import { generateSecureOrderId } from './secureIdGenerator';
import { validateAndSanitizeInput } from './xssProtection';
import { SecurityMonitor, SECURITY_EVENTS } from './securityMonitoring';

export interface SecurePaymentRequest {
  name: string;
  amount: number;
  message: string;
  phone?: string;
}

export const validatePaymentRequest = (request: SecurePaymentRequest): boolean => {
  // Validate name
  if (!request.name || request.name.trim().length === 0) {
    return false;
  }
  
  if (request.name.length > 100) {
    return false;
  }
  
  // Validate amount
  if (!request.amount || request.amount <= 0 || request.amount > 100000) {
    return false;
  }
  
  // Validate message length
  if (request.message && request.message.length > 500) {
    return false;
  }
  
  return true;
};

export const sanitizePaymentRequest = (request: SecurePaymentRequest): SecurePaymentRequest => {
  return {
    name: validateAndSanitizeInput(request.name, 100),
    amount: Math.min(Math.max(request.amount, 1), 100000), // Clamp between 1 and 100000
    message: validateAndSanitizeInput(request.message || '', 500),
    phone: request.phone ? validateAndSanitizeInput(request.phone, 15) : undefined
  };
};

export const createSecureOrderId = (prefix: string = 'ORDER'): string => {
  return generateSecureOrderId();
};

export const logPaymentSecurityEvent = (
  type: string,
  severity: 'low' | 'medium' | 'high',
  details: string,
  amount?: number
) => {
  SecurityMonitor.logSecurityEvent({
    type: type as any,
    severity,
    details,
    metadata: { amount }
  });
};

export const validatePaymentAmount = (amount: number): boolean => {
  // Validate reasonable payment amounts
  if (amount < 1 || amount > 100000) {
    logPaymentSecurityEvent(
      SECURITY_EVENTS.SUSPICIOUS_REQUEST,
      'medium',
      `Suspicious payment amount: ${amount}`
    );
    return false;
  }
  
  return true;
};

export const detectSuspiciousPaymentPattern = (
  name: string,
  message: string,
  amount: number
): boolean => {
  // Detect potentially suspicious patterns
  const suspiciousPatterns = [
    /script/gi,
    /javascript/gi,
    /onclick/gi,
    /onerror/gi,
    /onload/gi,
    /<[^>]*>/g, // HTML tags
    /eval\(/gi,
    /alert\(/gi
  ];
  
  const testString = `${name} ${message}`;
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(testString)) {
      logPaymentSecurityEvent(
        SECURITY_EVENTS.XSS_ATTEMPT,
        'high',
        `Suspicious pattern detected in payment: ${pattern.source}`
      );
      return true;
    }
  }
  
  return false;
};
