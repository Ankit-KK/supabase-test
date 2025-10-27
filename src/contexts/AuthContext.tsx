import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  username?: string;
  role: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('admin_emails')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();
      
      return !error && !!data;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    // Check for existing session in localStorage on mount
    const checkExistingSession = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const { data, error } = await supabase.rpc('validate_session_token', { token });
          if (!error && data && data.length > 0) {
            const userData = data[0];
            const adminStatus = await checkAdminStatus(userData.email);
            setUser({
              id: userData.user_id,
              email: userData.email,
              username: userData.username,
              role: userData.role,
              isAdmin: adminStatus
            });
          } else {
            localStorage.removeItem('auth_token');
          }
        } catch (error) {
          console.error('Session validation error:', error);
          localStorage.removeItem('auth_token');
        }
      }
      setLoading(false);
    };

    checkExistingSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('authenticate-user', {
        body: {
          action: 'login',
          email,
          password
        }
      });

      if (error) {
        return { error };
      }

      if (data.error) {
        return { error: { message: data.error } };
      }

      // Store session token and user data
      const adminStatus = await checkAdminStatus(data.user.email);
      localStorage.setItem('auth_token', data.session.access_token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        username: data.user.username,
        role: data.user.role,
        isAdmin: adminStatus
      });

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('authenticate-user', {
        body: {
          action: 'register',
          email,
          password
        }
      });

      if (error) {
        return { error };
      }

      if (data.error) {
        return { error: { message: data.error } };
      }

      // Store session token and user data
      const adminStatus = await checkAdminStatus(data.user.email);
      localStorage.setItem('auth_token', data.session.access_token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        username: data.user.username,
        role: data.user.role,
        isAdmin: adminStatus
      });

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};