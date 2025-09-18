import { useState, useEffect } from 'react';
import { useCustomAuth } from '@/contexts/CustomAuthContext';

interface AuthError {
  message: string;
  details?: any;
}

export const useCustomUniversalAuth = (streamerSlug: string) => {
  const [error, setError] = useState<AuthError | null>(null);
  const { session, loading } = useCustomAuth();

  useEffect(() => {
    // Check if current session matches the requested streamer
    if (session && session.streamer_slug !== streamerSlug) {
      setError({
        message: `You are logged in as ${session.streamer_name} but trying to access ${streamerSlug}`,
        details: 'Please sign out and sign in with the correct account.'
      });
    } else {
      setError(null);
    }
  }, [session, streamerSlug]);

  const logout = async () => {
    // This will be handled by the CustomAuthContext signOut method
  };

  return {
    session: session && session.streamer_slug === streamerSlug ? session : null,
    loading,
    error,
    logout,
    isAuthenticated: !!(session && session.streamer_slug === streamerSlug && session.isAuthenticated),
    user: session && session.streamer_slug === streamerSlug ? {
      id: session.id,
      email: session.email,
      streamer_name: session.streamer_name,
      brand_color: session.brand_color
    } : null
  };
};