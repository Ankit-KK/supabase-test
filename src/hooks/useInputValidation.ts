
import { useState, useCallback } from 'react';
import { validateDonationInput, sanitizeTextInput, sanitizeName, validateAmount } from '@/utils/securityUtils';

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
    }

    // Validate message
    if (message && message.length > 500) {
      newErrors.message = 'Message must be less than 500 characters';
    }

    // Validate amount
    if (!amount || amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (amount > 100000) {
      newErrors.amount = 'Amount must be less than ₹1,00,000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  const sanitizeInputs = useCallback((name: string, message: string) => {
    return {
      name: sanitizeName(name),
      message: sanitizeTextInput(message)
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
