
import { useState, useCallback } from 'react';
import { validateAndSanitizeInput } from '@/utils/xssProtection';
import { SecurityMonitor, SECURITY_EVENTS } from '@/utils/securityMonitoring';

interface ValidationErrors {
  name?: string;
  message?: string;
  amount?: string;
}

export const useInputValidation = () => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateDonation = useCallback((name: string, message: string, amount: number) => {
    const newErrors: ValidationErrors = {};

    // Validate name
    if (!name || name.trim() === '') {
      newErrors.name = 'Name is required';
    } else if (name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    } else if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(name)) {
      newErrors.name = 'Name contains invalid characters';
      SecurityMonitor.logSecurityEvent({
        type: SECURITY_EVENTS.XSS_ATTEMPT,
        severity: 'medium',
        details: 'Invalid characters in name field',
      });
    }

    // Validate message
    if (message && message.length > 500) {
      newErrors.message = 'Message must be less than 500 characters';
    }
    
    // Check for suspicious patterns in message
    const suspiciousPatterns = [
      /<script/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi
    ];
    
    if (message) {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(message)) {
          newErrors.message = 'Message contains invalid content';
          SecurityMonitor.logSecurityEvent({
            type: SECURITY_EVENTS.XSS_ATTEMPT,
            severity: 'high',
            details: 'Suspicious pattern detected in message',
          });
          break;
        }
      }
    }

    // Validate amount
    if (!amount || amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (amount > 100000) {
      newErrors.amount = 'Amount must be less than ₹1,00,000';
      SecurityMonitor.logSecurityEvent({
        type: SECURITY_EVENTS.SUSPICIOUS_REQUEST,
        severity: 'medium',
        details: `Unusually high donation amount: ${amount}`,
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  const sanitizeInputs = useCallback((name: string, message: string) => {
    const sanitizedName = validateAndSanitizeInput(name, 100);
    const sanitizedMessage = validateAndSanitizeInput(message, 500);
    
    // Log if sanitization changed the input (potential attack)
    if (name !== sanitizedName || message !== sanitizedMessage) {
      SecurityMonitor.logSecurityEvent({
        type: SECURITY_EVENTS.XSS_ATTEMPT,
        severity: 'medium',
        details: 'Input sanitization removed potentially malicious content',
      });
    }
    
    return {
      name: sanitizedName,
      message: sanitizedMessage
    };
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validateDonation,
    sanitizeInputs,
    clearErrors
  };
};
