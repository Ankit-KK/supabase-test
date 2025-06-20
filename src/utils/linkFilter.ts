
// Link filtering utilities for donation messages
export const containsLinks = (text: string): boolean => {
  if (!text) return false;
  
  // Common URL patterns
  const urlPatterns = [
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
    /www\.[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
    /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.(com|org|net|edu|gov|mil|int|co|uk|ca|de|jp|fr|au|us|ru|ch|it|nl|se|no|es|mil|xyz|info|biz|online|site|tech|store|app|me|io|ly|be|cc|tv|live|stream|gg|pro|blog|news|shop|top|click|link|download|free|best|new|now|get|win|play|game|fun|cool|hot|wow|lol|omg|wtf|404|666|123|abc|test|demo|sample)\b/gi,
    // Social media patterns
    /(?:instagram|insta|ig)\.com/gi,
    /(?:facebook|fb)\.com/gi,
    /(?:twitter|x)\.com/gi,
    /(?:youtube|yt)\.com/gi,
    /(?:twitch)\.tv/gi,
    /(?:discord)\.gg/gi,
    /(?:t\.me|telegram\.me)/gi,
    /(?:tiktok)\.com/gi,
    // Common link words
    /\b(?:bit\.ly|tinyurl|shorturl|goo\.gl|t\.co|ow\.ly|is\.gd|buff\.ly)\b/gi,
    // Email patterns
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi
  ];
  
  return urlPatterns.some(pattern => pattern.test(text));
};

export const filterMessage = (message: string): { isValid: boolean; filteredMessage: string; reason?: string } => {
  if (!message) {
    return { isValid: true, filteredMessage: message };
  }
  
  // Check for links
  if (containsLinks(message)) {
    return {
      isValid: false,
      filteredMessage: '',
      reason: 'Messages cannot contain links, URLs, or social media handles'
    };
  }
  
  // Check for suspicious patterns that might be disguised links
  const suspiciousPatterns = [
    /\b(?:visit|check|click|go to|see at|find at|watch at|follow me|subscribe|like and subscribe)\s+[a-zA-Z0-9@._-]+/gi,
    /\b[a-zA-Z0-9._-]+\s+(?:dot|DOT)\s+(?:com|org|net|in|co)/gi,
    /\b(?:dm|message|contact)\s+(?:me|us)\s+(?:at|on|for)/gi
  ];
  
  const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(message));
  if (hasSuspiciousContent) {
    return {
      isValid: false,
      filteredMessage: '',
      reason: 'Messages cannot contain promotional content or contact information'
    };
  }
  
  return { isValid: true, filteredMessage: message };
};

export const sanitizeMessage = (message: string): string => {
  if (!message) return '';
  
  // Remove any potential harmful content while preserving the message
  return message
    .trim()
    .replace(/[<>"'&]/g, '') // Remove HTML/script injection characters
    .substring(0, 500); // Limit length
};
