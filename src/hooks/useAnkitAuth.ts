import { useState, useEffect } from 'react';

interface AnkitSession {
  streamerId: string;
  streamerSlug: string;
  streamerName: string;
  brandColor: string;
  loginTime: number;
}

export const useAnkitAuth = () => {
  const [session, setSession] = useState<AnkitSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = () => {
      try {
        const stored = localStorage.getItem('ankit_session');
        if (stored) {
          const session = JSON.parse(stored) as AnkitSession;
          
          // Check if session is less than 24 hours old and is ankit
          const isValid = Date.now() - session.loginTime < 24 * 60 * 60 * 1000;
          const isAnkit = session.streamerSlug === 'ankit';
          
          if (isValid && isAnkit) {
            setSession(session);
          } else {
            localStorage.removeItem('ankit_session');
            setSession(null);
          }
        }
      } catch (error) {
        console.error('Error checking ankit session:', error);
        localStorage.removeItem('ankit_session');
        setSession(null);
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const logout = () => {
    localStorage.removeItem('ankit_session');
    setSession(null);
  };

  return {
    session,
    loading,
    logout,
    isAuthenticated: !!session
  };
};