
// Security utilities for input validation and sanitization
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

// Rate limiting check (simplified for client-side)
export const checkClientRateLimit = (endpoint: string, maxRequests: number = 5): boolean => {
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
    return false;
  }
  
  // Increment counter
  localStorage.setItem(key, JSON.stringify({ count: data.count + 1, timestamp: data.timestamp }));
  return true;
};
