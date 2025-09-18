import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface StreamerSession {
  id: string;
  streamer_slug: string;
  streamer_name: string;
  brand_color: string;
  user_email: string;
  isAuthenticated: boolean;
}

interface AuthError {
  message: string;
  details?: any;
}

export const useUniversalAuth = (streamerSlug: string) => {
  const [session, setSession] = useState<StreamerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const { user, session: authSession, loading: authLoading } = useAuth();
  const isChecking = useRef(false);

  useEffect(() => {
    const checkSession = async () => {
      if (isChecking.current || authLoading) return;
      isChecking.current = true;
      
      try {
        setError(null);
        
        // Only check for Google OAuth authenticated users
        if (user && authSession && !authLoading) {
          // Check if this email is allowed to access the streamer dashboard
          const { data: isAllowed } = await supabase.rpc('check_streamer_email_allowed', {
            p_streamer_slug: streamerSlug,
            p_email: user.email
          });

          if (isAllowed) {
            // Get streamer information
            const { data: streamerData } = await supabase.rpc('get_public_streamer_info', {
              slug: streamerSlug
            });

            if (streamerData && streamerData.length > 0) {
              const streamer = streamerData[0];
              
              setSession({
                id: streamer.id,
                streamer_slug: streamer.streamer_slug,
                streamer_name: streamer.streamer_name,
                brand_color: streamer.brand_color,
                user_email: user.email,
                isAuthenticated: true
              });

              // Record login attempt
              await supabase.rpc('record_streamer_login', {
                p_streamer_slug: streamerSlug,
                p_email: user.email,
                p_provider: 'google'
              });
            } else {
              setError({ message: `Streamer "${streamerSlug}" not found` });
            }
          } else {
            setError({ 
              message: `Access denied. Your email (${user.email}) is not authorized for ${streamerSlug} dashboard.`,
              details: 'Please contact the administrator to get access.'
            });
          }
        } else if (!authLoading) {
          setSession(null);
        }
      } catch (err: any) {
        console.error(`Universal auth error for ${streamerSlug}:`, err);
        setError({
          message: err.message || 'Authentication failed',
          details: err
        });
      } finally {
        setLoading(false);
        isChecking.current = false;
      }
    };

    if (!authLoading) {
      checkSession();
    }
  }, [user, authSession, authLoading, streamerSlug]);

  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setSession(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      setError({
        message: 'Failed to logout',
        details: error
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    loading,
    error,
    logout,
    isAuthenticated: !!session?.isAuthenticated,
    user: session ? {
      id: session.id,
      email: session.user_email,
      streamer_name: session.streamer_name,
      brand_color: session.brand_color
    } : null
  };
};