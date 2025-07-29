// Content Security Policy utilities
export const CSP_DIRECTIVES = {
  default: "'self'",
  script: "'self' 'unsafe-inline' https://js.razorpay.com https://checkout.razorpay.com",
  style: "'self' 'unsafe-inline' https://fonts.googleapis.com",
  font: "'self' https://fonts.gstatic.com",
  img: "'self' data: blob: https://*.supabase.co https://images.unsplash.com",
  media: "'self' blob: https://*.supabase.co",
  connect: "'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com",
  frame: "'none'",
  object: "'none'",
  base: "'self'"
};

export const generateCSP = (nonce?: string): string => {
  const directives = {
    "default-src": CSP_DIRECTIVES.default,
    "script-src": nonce ? `${CSP_DIRECTIVES.script} 'nonce-${nonce}'` : CSP_DIRECTIVES.script,
    "style-src": CSP_DIRECTIVES.style,
    "font-src": CSP_DIRECTIVES.font,
    "img-src": CSP_DIRECTIVES.img,
    "media-src": CSP_DIRECTIVES.media,
    "connect-src": CSP_DIRECTIVES.connect,
    "frame-src": CSP_DIRECTIVES.frame,
    "object-src": CSP_DIRECTIVES.object,
    "base-uri": CSP_DIRECTIVES.base,
    "form-action": "'self'",
    "frame-ancestors": "'none'",
    "upgrade-insecure-requests": "",
    "block-all-mixed-content": ""
  };

  return Object.entries(directives)
    .map(([key, value]) => value ? `${key} ${value}` : key)
    .join('; ');
};

// Apply CSP to document
export const applyCSP = (): void => {
  if (typeof document === 'undefined') return;

  const existingMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existingMeta) return; // Already applied

  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = generateCSP();
  document.head.appendChild(meta);
};

// CSP violation reporting
export const setupCSPReporting = (): void => {
  if (typeof document === 'undefined') return;

  document.addEventListener('securitypolicyviolation', (event) => {
    console.warn('CSP Violation:', {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      disposition: event.disposition
    });

    // Log to security monitoring
    const violation = {
      type: 'csp_violation',
      severity: 'medium' as const,
      details: `CSP violation: ${event.violatedDirective} blocked ${event.blockedURI}`,
      metadata: {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber
      }
    };

    // Store violation for analysis
    const violations = JSON.parse(localStorage.getItem('csp_violations') || '[]');
    violations.push({
      ...violation,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('csp_violations', JSON.stringify(violations.slice(-50)));
  });
};

// Initialize CSP on module load
if (typeof window !== 'undefined') {
  applyCSP();
  setupCSPReporting();
}