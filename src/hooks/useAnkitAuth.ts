import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  const { user, session: authSession, loading: authLoading } = useAuth();

  useEffect(() => {
    const checkSession = async () => {
      try {
        // First check for traditional localStorage session
        const stored = localStorage.getItem('ankit_session');
        if (stored) {
          const localSession = JSON.parse(stored) as AnkitSession;
          
          // Check if session is less than 24 hours old and is ankit
          const isValid = Date.now() - localSession.loginTime < 24 * 60 * 60 * 1000;
          const isAnkit = localSession.streamerSlug === 'ankit';
          
          if (isValid && isAnkit) {
            setSession(localSession);
            setLoading(false);
            return;
          } else {
            localStorage.removeItem('ankit_session');
          }
        }

        // Check for authenticated Google OAuth user with ankit streamer
        if (user && authSession && !authLoading) {
          // Try to find the linked streamer for this user
          let { data: streamerData } = await supabase
            .from('streamers')
            .select('*')
            .eq('user_id', user.id)
            .eq('streamer_slug', 'ankit')
            .single();

          if (!streamerData) {
            // Attempt to securely link this streamer to the current user (if unclaimed)
            await supabase.rpc('link_streamer_to_current_user', { p_streamer_slug: 'ankit' });
            // Re-fetch after linking attempt
            const retry = await supabase
              .from('streamers')
              .select('*')
              .eq('user_id', user.id)
              .eq('streamer_slug', 'ankit')
              .single();
            streamerData = retry.data ?? null;
          }

          if (streamerData) {
            const authSession: AnkitSession = {
              streamerId: streamerData.id,
              streamerSlug: streamerData.streamer_slug,
              streamerName: streamerData.streamer_name,
              brandColor: streamerData.brand_color,
              loginTime: Date.now()
            };
            setSession(authSession);
          } else {
            setSession(null);
          }
        } else if (!authLoading) {
          setSession(null);
        }
      } catch (error) {
        console.error('Error checking ankit session:', error);
        localStorage.removeItem('ankit_session');
        setSession(null);
      }
      setLoading(false);
    };

    if (!authLoading) {
      checkSession();
    }
  }, [user, authSession, authLoading]);

  const logout = async () => {
    // Clear local session
    localStorage.removeItem('ankit_session');
    setSession(null);
    
    // If user is authenticated via Google OAuth, sign them out from Supabase
    if (user && authSession) {
      await supabase.auth.signOut();
    }
  };

  return {
    session,
    loading,
    logout,
    isAuthenticated: !!session
  };
};