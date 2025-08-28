import { useState, useEffect } from 'react';

export interface NewStreamerSession {
  streamerId: string;
  streamerSlug: string;
  streamerName: string;
  brandColor: string;
  isAuthenticated: boolean;
}

const SESSION_KEY = 'newstreamer_session';

export const useNewStreamerAuth = () => {
  const [session, setSession] = useState<NewStreamerSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load session from localStorage on mount
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        setSession(parsedSession);
      } catch (error) {
        console.error('Error parsing saved session:', error);
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // For demo purposes, we'll use a simple check
      // In a real app, this would validate against the database
      if (username === 'newstreamer' && password === 'password123') {
        const newSession: NewStreamerSession = {
          streamerId: 'newstreamer-id', // This would come from the database
          streamerSlug: 'newstreamer',
          streamerName: 'New Streamer',
          brandColor: '#10b981',
          isAuthenticated: true,
        };

        setSession(newSession);
        localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
        
        return { success: true };
      } else {
        return { success: false, error: 'Invalid username or password' };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return {
    session,
    loading,
    login,
    logout,
    isAuthenticated: !!session?.isAuthenticated,
  };
};