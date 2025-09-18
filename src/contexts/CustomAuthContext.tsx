import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StreamerSession {
  id: string;
  streamer_slug: string;
  streamer_name: string;
  brand_color: string;
  email: string;
  token: string;
  isAuthenticated: boolean;
}

interface CustomAuthContextType {
  session: StreamerSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const CustomAuthContext = createContext<CustomAuthContextType | undefined>(undefined);

export const useCustomAuth = () => {
  const context = useContext(CustomAuthContext);
  if (!context) {
    throw new Error('useCustomAuth must be used within a CustomAuthProvider');
  }
  return context;
};

export const CustomAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<StreamerSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const storedSession = localStorage.getItem('streamer_session');
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        setSession(parsedSession);
      } catch (error) {
        console.error('Error parsing stored session:', error);
        localStorage.removeItem('streamer_session');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('validate-streamer-auth', {
        body: { email, password }
      });

      if (error) {
        return { error: { message: 'Authentication failed' } };
      }

      if (data.success && data.session) {
        const sessionData = data.session;
        setSession(sessionData);
        localStorage.setItem('streamer_session', JSON.stringify(sessionData));
        return { error: null };
      } else {
        return { error: { message: data.error || 'Invalid credentials' } };
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error: { message: error.message || 'Authentication failed' } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setSession(null);
      localStorage.removeItem('streamer_session');
    } catch (error: any) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    loading,
    signIn,
    signOut,
  };

  return (
    <CustomAuthContext.Provider value={value}>
      {children}
    </CustomAuthContext.Provider>
  );
};