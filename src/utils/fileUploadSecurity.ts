
// File upload security utilities
export interface SecureFileValidation {
  isValid: boolean;
  error?: string;
  sanitizedName?: string;
}

export const validateFileUpload = async (file: File): Promise<SecureFileValidation> => {
  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size exceeds 5MB limit' };
  }
  
  // Validate file type by checking actual file signature, not just extension
  const allowedTypes = {
    'image/gif': [0x47, 0x49, 0x46, 0x38], // GIF
    'audio/webm': [0x1A, 0x45, 0xDF, 0xA3], // WebM
    'audio/wav': [0x52, 0x49, 0x46, 0x46], // WAV
  };
  
  return new Promise<SecureFileValidation>((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      if (!arrayBuffer) {
        resolve({ isValid: false, error: 'Could not read file' });
        return;
      }
      
      const bytes = new Uint8Array(arrayBuffer.slice(0, 8));
      let isValidType = false;
      
      for (const [mimeType, signature] of Object.entries(allowedTypes)) {
        if (file.type === mimeType && bytes.length >= signature.length) {
          const matches = signature.every((byte, index) => bytes[index] === byte);
          if (matches) {
            isValidType = true;
            break;
          }
        }
      }
      
      if (!isValidType) {
        resolve({ isValid: false, error: 'Invalid file type or corrupted file' });
        return;
      }
      
      // Sanitize filename
      const sanitizedName = sanitizeFilename(file.name);
      resolve({ isValid: true, sanitizedName });
    };
    
    reader.onerror = () => {
      resolve({ isValid: false, error: 'Could not read file' });
    };
    
    reader.readAsArrayBuffer(file.slice(0, 8));
  });
};

export const sanitizeFilename = (filename: string): string => {
  // Remove dangerous characters and limit length
  return filename
    .replace(/[^a-zA-Z0-9\-_\.]/g, '')
    .substring(0, 100)
    .toLowerCase();
};

export const generateSecureFilename = (originalName: string): string => {
  const sanitized = sanitizeFilename(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = sanitized.split('.').pop() || '';
  
  return `${timestamp}-${random}.${extension}`;
};
