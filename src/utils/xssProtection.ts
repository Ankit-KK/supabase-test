
// XSS Protection utilities
export const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  
  // Remove script tags and dangerous attributes
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '');
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
