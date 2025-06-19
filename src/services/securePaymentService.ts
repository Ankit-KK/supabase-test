
import { supabase } from "@/integrations/supabase/client";
import { validateDonationInput, sanitizeTextInput, sanitizeName } from "@/utils/securityUtils";
import { checkServerRateLimit, logSecurityEvent } from "@/utils/rateLimiting";

export interface SecureDonationData {
  name: string;
  amount: number;
  message: string;
  includeSound?: boolean;
  gifFile?: File;
  voiceFile?: File;
  customSoundName?: string;
  customSoundUrl?: string;
}

export const createSecureDonation = async (
  data: SecureDonationData,
  streamerType: string,
  ipAddress: string = 'unknown'
): Promise<{ success: boolean; orderId?: string; error?: string }> => {
  try {
    // Rate limiting check
    const rateLimitOk = await checkServerRateLimit(ipAddress, 'donation_create', 5, 1);
    if (!rateLimitOk) {
      await logSecurityEvent('RATE_LIMIT_EXCEEDED', 'donation_create', ipAddress);
      return { success: false, error: 'Too many requests. Please try again later.' };
    }

    // Input validation
    if (!validateDonationInput(data.name, data.message, data.amount)) {
      await logSecurityEvent('INVALID_INPUT', 'donation_validation_failed', ipAddress);
      return { success: false, error: 'Invalid input data provided.' };
    }

    // Sanitize inputs
    const sanitizedName = sanitizeName(data.name);
    const sanitizedMessage = sanitizeTextInput(data.message);

    // Validate sanitized inputs again
    if (!sanitizedName || sanitizedName.length === 0) {
      return { success: false, error: 'Invalid name provided.' };
    }

    // Server-side validation using the database function
    const { data: isValid, error: validationError } = await supabase.rpc('validate_donation_input', {
      p_name: sanitizedName,
      p_message: sanitizedMessage,
      p_amount: data.amount
    });

    if (validationError || !isValid) {
      await logSecurityEvent('SERVER_VALIDATION_FAILED', 'donation_input_validation', ipAddress);
      return { success: false, error: 'Input validation failed.' };
    }

    // Create payment order with sanitized data
    const orderResponse = await fetch('/api/create-payment-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: data.amount,
        name: sanitizedName,
        message: sanitizedMessage,
        streamerType,
        includeSound: data.includeSound || false,
        customSoundName: data.customSoundName ? sanitizeTextInput(data.customSoundName) : undefined,
        customSoundUrl: data.customSoundUrl ? sanitizeTextInput(data.customSoundUrl) : undefined
      }),
    });

    if (!orderResponse.ok) {
      await logSecurityEvent('PAYMENT_ORDER_FAILED', `HTTP ${orderResponse.status}`, ipAddress);
      return { success: false, error: 'Failed to create payment order.' };
    }

    const orderData = await orderResponse.json();
    
    // Log successful order creation
    await logSecurityEvent('PAYMENT_ORDER_CREATED', `Order ID: ${orderData.orderId}`, ipAddress);
    
    return { success: true, orderId: orderData.orderId };

  } catch (error) {
    console.error('Secure donation creation error:', error);
    await logSecurityEvent('DONATION_CREATION_ERROR', error instanceof Error ? error.message : 'Unknown error', ipAddress);
    return { success: false, error: 'An unexpected error occurred.' };
  }
};

export const validateDonationBeforeSubmission = (data: SecureDonationData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate name
  if (!data.name || data.name.trim() === '') {
    errors.push('Name is required');
  } else if (data.name.length > 100) {
    errors.push('Name must be less than 100 characters');
  } else if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(data.name)) {
    errors.push('Name contains invalid characters');
  }

  // Validate message
  if (data.message && data.message.length > 500) {
    errors.push('Message must be less than 500 characters');
  }

  // Validate amount
  if (!data.amount || data.amount <= 0) {
    errors.push('Amount must be greater than 0');
  } else if (data.amount > 100000) {
    errors.push('Amount must be less than ₹1,00,000');
  }

  return { valid: errors.length === 0, errors };
};
