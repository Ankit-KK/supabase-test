import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CustomUser {
  id: string;
  email: string;
  username?: string;
  role: string;
}

interface CustomSession {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: CustomUser;
}

interface AuthContextType {
  user: CustomUser | null;
  session: CustomSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [session, setSession] = useState<CustomSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load session from localStorage on startup
    const loadSession = () => {
      const storedSession = localStorage.getItem('auth_session');
      if (storedSession) {
        try {
          const parsedSession = JSON.parse(storedSession);
          setSession(parsedSession);
          setUser(parsedSession.user);
        } catch (error) {
          console.error('Error parsing stored session:', error);
          localStorage.removeItem('auth_session');
        }
      }
      setLoading(false);
    };

    loadSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('authenticate-user', {
        body: { action: 'login', email, password }
      });

      if (error) {
        return { error };
      }

      if (data.error) {
        return { error: { message: data.error } };
      }

      const customSession: CustomSession = {
        access_token: data.session.access_token,
        token_type: data.session.token_type,
        expires_in: data.session.expires_in,
        user: data.user
      };

      localStorage.setItem('auth_session', JSON.stringify(customSession));
      setSession(customSession);
      setUser(data.user);

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('authenticate-user', {
        body: { action: 'register', email, password }
      });

      if (error) {
        return { error };
      }

      if (data.error) {
        return { error: { message: data.error } };
      }

      const customSession: CustomSession = {
        access_token: data.session.access_token,
        token_type: data.session.token_type,
        expires_in: data.session.expires_in,
        user: data.user
      };

      localStorage.setItem('auth_session', JSON.stringify(customSession));
      setSession(customSession);
      setUser(data.user);

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_session');
    setSession(null);
    setUser(null);
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};