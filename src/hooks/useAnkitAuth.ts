import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AnkitSession {
  streamerId: string;
  streamerSlug: string;
  streamerName: string;
  brandColor: string;
  loginTime: number;
  isAdmin?: boolean;
}

export const useAnkitAuth = () => {
  const [session, setSession] = useState<AnkitSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, session: authSession, loading: authLoading } = useAuth();

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Only check for Google OAuth authenticated users
        if (user && authSession && !authLoading) {
          // Check if user is admin (can access any dashboard)
          const { data: isAdminResult } = await supabase.rpc('is_admin_email', { 
            check_email: user.email 
          });

          if (isAdminResult) {
            // Admin user - can access ankit dashboard
            const { data: streamerData } = await supabase
              .from('streamers')
              .select('*')
              .eq('streamer_slug', 'ankit')
              .single();

            if (streamerData) {
              const adminSession: AnkitSession = {
                streamerId: streamerData.id,
                streamerSlug: streamerData.streamer_slug,
                streamerName: streamerData.streamer_name,
                brandColor: streamerData.brand_color,
                loginTime: Date.now(),
                isAdmin: true
              };
              setSession(adminSession);
            }
          } else {
            // Regular user - check if they own the ankit streamer
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
              const userSession: AnkitSession = {
                streamerId: streamerData.id,
                streamerSlug: streamerData.streamer_slug,
                streamerName: streamerData.streamer_name,
                brandColor: streamerData.brand_color,
                loginTime: Date.now(),
                isAdmin: false
              };
              setSession(userSession);
            } else {
              setSession(null);
            }
          }
        } else if (!authLoading) {
          setSession(null);
        }
      } catch (error) {
        console.error('Error checking ankit session:', error);
        setSession(null);
      }
      setLoading(false);
    };

    if (!authLoading) {
      checkSession();
    }
  }, [user, authSession, authLoading]);

  const logout = async () => {
    // Clear session state
    setSession(null);
    
    // Sign out from Supabase (handles Google OAuth)
    await supabase.auth.signOut();
  };

  return {
    session,
    loading,
    logout,
    isAuthenticated: !!session
  };
};