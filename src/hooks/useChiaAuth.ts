import { useState, useEffect } from 'react';

interface ChiaSession {
  streamerId: string;
  streamerSlug: string;
  streamerName: string;
  brandColor: string;
  loginTime: number;
}

export const useChiaAuth = () => {
  const [session, setSession] = useState<ChiaSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = () => {
      try {
        const stored = localStorage.getItem('chia_session');
        if (stored) {
          const session = JSON.parse(stored) as ChiaSession;
          
          // Check if session is less than 24 hours old and is chia_gaming
          const isValid = Date.now() - session.loginTime < 24 * 60 * 60 * 1000;
          const isChia = session.streamerSlug === 'chia_gaming';
          
          if (isValid && isChia) {
            setSession(session);
          } else {
            localStorage.removeItem('chia_session');
            setSession(null);
          }
        }
      } catch (error) {
        console.error('Error checking chia session:', error);
        localStorage.removeItem('chia_session');
        setSession(null);
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const logout = () => {
    localStorage.removeItem('chia_session');
    setSession(null);
  };

  return {
    session,
    loading,
    logout,
    isAuthenticated: !!session
  };
};