
// XSS Protection utilities
export const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  
  // Comprehensive HTML sanitization
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/url\s*\(/gi, '')
    .replace(/import\s+/gi, '')
    .replace(/@import/gi, '')
    .replace(/behaviour\s*:/gi, '')
    .replace(/-moz-binding\s*:/gi, '');
};

export const escapeHtml = (text: string): string => {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  
  // Only allow http, https, and relative URLs
  const allowedProtocols = ['http:', 'https:', ''];
  try {
    const parsed = new URL(url, window.location.origin);
    if (allowedProtocols.includes(parsed.protocol)) {
      return parsed.toString();
    }
  } catch {
    // Invalid URL, return empty string
  }
  return '';
};

export const validateAndSanitizeInput = (input: string, maxLength: number = 500): string => {
  if (!input) return '';
  
  // First sanitize HTML
  let sanitized = sanitizeHtml(input);
  
  // Then escape remaining HTML entities
  sanitized = escapeHtml(sanitized);
  
  // Trim to max length
  return sanitized.substring(0, maxLength);
};

// Content Security Policy helper
export const generateCSPNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)));
};

// Enhanced file validation
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'audio/wav'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.jar', '.app', '.deb', '.dmg'];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large' };
  }
  
  const fileName = file.name.toLowerCase();
  if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
    return { valid: false, error: 'Dangerous file extension' };
  }
  
  return { valid: true };
};

// SQL injection prevention for user inputs
export const sanitizeSqlInput = (input: string): string => {
  if (!input) return '';
  
  // Remove SQL injection patterns
  return input
    .replace(/['";\\]/g, '')
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/gi, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .trim();
};
