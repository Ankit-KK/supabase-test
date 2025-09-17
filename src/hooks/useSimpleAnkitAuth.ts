import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnkitSession {
  id: string;
  streamerSlug: string;
  streamerName: string;
  brandColor: string;
  loginTime: number;
}

interface AuthError {
  message: string;
  type: 'unauthorized' | 'server_error' | 'invalid_credentials';
}

export const useSimpleAnkitAuth = () => {
  const [session, setSession] = useState<AnkitSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('ankit_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        // Check if session is still valid (24 hours)
        if (Date.now() - parsed.loginTime < 24 * 60 * 60 * 1000) {
          setSession(parsed);
        } else {
          localStorage.removeItem('ankit_session');
        }
      } catch (e) {
        localStorage.removeItem('ankit_session');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('authenticate_streamer_simple', {
        p_username: username,
        p_password: password
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      const result = data?.[0];
      
      if (!result?.success) {
        setError({
          message: 'Invalid username or password',
          type: 'invalid_credentials'
        });
        setLoading(false);
        return { success: false };
      }

      const newSession: AnkitSession = {
        id: result.id,
        streamerSlug: result.streamer_slug,
        streamerName: result.streamer_name,
        brandColor: result.brand_color,
        loginTime: Date.now()
      };

      setSession(newSession);
      localStorage.setItem('ankit_session', JSON.stringify(newSession));
      setLoading(false);
      return { success: true };

    } catch (err: any) {
      setError({
        message: err.message || 'Login failed',
        type: 'server_error'
      });
      setLoading(false);
      return { success: false };
    }
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem('ankit_session');
  };

  return {
    session,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!session
  };
};