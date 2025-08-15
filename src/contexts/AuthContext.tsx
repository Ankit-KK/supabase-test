import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isStreamer: boolean;
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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStreamer, setIsStreamer] = useState(false);

  useEffect(() => {
    console.log('AuthContext: Setting up auth listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed', { event, session: !!session });
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('AuthContext: User exists, checking streamer status');
          // Check if user is a streamer
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              console.log('AuthContext: Profile data', profile);
              
              if (error && error.code !== 'PGRST116') {
                console.error('AuthContext: Error fetching profile', error);
                setIsStreamer(false);
                return;
              }
              
              // If no profile exists or is_streamer is not set, treat as non-streamer for now
              const isStreamerValue = (profile as any)?.is_streamer === true;
              console.log('AuthContext: Setting isStreamer to', isStreamerValue);
              setIsStreamer(isStreamerValue);
            } catch (error) {
              console.error('AuthContext: Error fetching profile', error);
              setIsStreamer(false);
            }
          }, 0);
        } else {
          console.log('AuthContext: No user, setting streamer to false');
          setIsStreamer(false);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log('AuthContext: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        }
      }
    });

    // Initialize streamer profile if signup successful
    if (data.user && !error) {
      // Manually insert/update profile since RPC might not be available yet
      await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: email,
          display_name: displayName,
          is_streamer: true
        });
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isStreamer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};