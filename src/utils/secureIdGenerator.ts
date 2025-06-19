
// Secure ID generation utility using crypto.getRandomValues()
export const generateSecureId = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const generateObsToken = (): string => {
  // Generate cryptographically secure random token for OBS overlays
  return generateSecureId(48); // 384 bits of entropy
};

export const validateSecureId = (id: string): boolean => {
  // Validate that ID is properly formatted hex string
  return /^[a-f0-9]{32,}$/.test(id);
};

// Replace all insecure random generation
export const generateSecurePhoneNumber = (): string => {
  // Generate a secure 10-digit phone number
  const array = new Uint8Array(5);
  crypto.getRandomValues(array);
  let phoneNumber = '9'; // Start with 9 for Indian mobile numbers
  
  for (let i = 0; i < 9; i++) {
    const randomByte = array[i % 5];
    phoneNumber += (randomByte % 10).toString();
  }
  
  return phoneNumber.substring(0, 10);
};

export const generateSecureOrderId = (): string => {
  const timestamp = Date.now().toString();
  const secureRandom = generateSecureId(16);
  return `ORDER_${timestamp}_${secureRandom}`;
};
