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
    console.log('Debug - session:', session);
    console.log('Debug - streamerSlug:', streamerSlug);
    
    // Check if current session matches the requested streamer
    if (session && session.streamer_slug !== streamerSlug) {
      console.log('Session mismatch:', session.streamer_slug, 'vs', streamerSlug);
      setError({
        message: `You are logged in as ${session.streamer_name} but trying to access ${streamerSlug}`,
        details: 'Please sign out and sign in with the correct account.'
      });
    } else {
      console.log('Session matches or no session');
      setError(null);
    }
  }, [session, streamerSlug]);

  const logout = async () => {
    const { signOut } = useCustomAuth();
    await signOut();
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