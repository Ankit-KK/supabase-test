
// CSRF Protection utility
export class CSRFProtection {
  private static token: string | null = null;
  
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    this.token = token;
    sessionStorage.setItem('csrf_token', token);
    return token;
  }
  
  static getToken(): string | null {
    if (!this.token) {
      this.token = sessionStorage.getItem('csrf_token');
    }
    return this.token;
  }
  
  static validateToken(receivedToken: string): boolean {
    const storedToken = this.getToken();
    return storedToken !== null && storedToken === receivedToken;
  }
  
  static clearToken(): void {
    this.token = null;
    sessionStorage.removeItem('csrf_token');
  }
}
