import { useState, useEffect } from 'react';

interface StreamerSession {
  streamerId: string;
  streamerSlug: string;
  streamerName: string;
  brandColor: string;
  loginTime: number;
}

export const useStreamerAuth = () => {
  const [session, setSession] = useState<StreamerSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = () => {
      try {
        const stored = localStorage.getItem('streamer_session');
        if (stored) {
          const session = JSON.parse(stored) as StreamerSession;
          
          // Check if session is less than 24 hours old
          const isValid = Date.now() - session.loginTime < 24 * 60 * 60 * 1000;
          
          if (isValid) {
            setSession(session);
          } else {
            localStorage.removeItem('streamer_session');
            setSession(null);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        localStorage.removeItem('streamer_session');
        setSession(null);
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const logout = () => {
    localStorage.removeItem('streamer_session');
    setSession(null);
  };

  return {
    session,
    loading,
    logout,
    isAuthenticated: !!session
  };
};