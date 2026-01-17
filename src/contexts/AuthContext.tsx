import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  username?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to extract meaningful error messages from edge function responses
const extractErrorMessage = (error: any): string => {
  // Check for rate limiting (429)
  if (error?.message?.includes('429') || error?.context?.status === 429) {
    return 'Too many login attempts. Please wait a minute before trying again.';
  }
  
  // Check for account locked (423)
  if (error?.message?.includes('423') || error?.context?.status === 423) {
    return 'Your account is temporarily locked due to too many failed attempts. Please try again later.';
  }
  
  // Check for unauthorized (401)
  if (error?.message?.includes('401') || error?.context?.status === 401) {
    return 'Invalid email or password.';
  }
  
  // Try to parse JSON error body if available
  try {
    if (error?.context?.body) {
      const body = JSON.parse(error.context.body);
      if (body.error) return body.error;
    }
  } catch {
    // Ignore parsing errors
  }
  
  // Return the error message or a default
  return error?.message || 'Authentication failed. Please try again.';
};

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

  useEffect(() => {
    // Check for existing session in localStorage on mount
    const checkExistingSession = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const { data, error } = await supabase.rpc('validate_session_token', { plain_token: token });
          if (!error && data && data.length > 0) {
          const userData = data[0] as any; // Type cast needed as DB returns 'user_id'
            setUser({
              id: userData.user_id,
              email: userData.email,
              username: userData.username,
              role: userData.role
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

      // Handle edge function invocation error (network, HTTP errors like 401, 429, etc.)
      if (error) {
        const errorMessage = extractErrorMessage(error);
        return { error: { message: errorMessage } };
      }

      // Handle application-level errors returned in data
      if (data?.error) {
        return { error: { message: data.error } };
      }

      // Store session token and user data
      localStorage.setItem('auth_token', data.session.access_token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        username: data.user.username,
        role: data.user.role
      });

      return { error: null };
    } catch (error: any) {
      return { error: { message: 'Connection error. Please check your internet and try again.' } };
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

      // Handle edge function invocation error
      if (error) {
        const errorMessage = extractErrorMessage(error);
        return { error: { message: errorMessage } };
      }

      // Handle application-level errors returned in data
      if (data?.error) {
        return { error: { message: data.error } };
      }

      // Store session token and user data
      localStorage.setItem('auth_token', data.session.access_token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        username: data.user.username,
        role: data.user.role
      });

      return { error: null };
    } catch (error: any) {
      return { error: { message: 'Connection error. Please check your internet and try again.' } };
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