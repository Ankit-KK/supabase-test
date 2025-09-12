import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DemoStreamerSession {
  streamerId: string;
  streamerSlug: string;
  streamerName: string;
  brandColor: string;
  loginTime: string;
  isAdmin?: boolean;
}

interface AuthError {
  message: string;
  type: 'unauthorized' | 'not_found' | 'general';
}

export const useDemoStreamerAuth = () => {
  const [session, setSession] = useState<DemoStreamerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const { user, session: authSession, loading: authLoading } = useAuth();

  useEffect(() => {
    const checkSession = async () => {
      try {
        setError(null);
        
        // Only check for Google OAuth authenticated users
        if (user && authSession && !authLoading) {
          console.log('DemoStreamer Auth - Checking user:', user.email);
          
          // Check if this email is allowed to access the demostreamer dashboard
          const { data: isAllowed, error: emailCheckError } = await supabase.rpc('check_streamer_email_allowed', {
            p_streamer_slug: 'demostreamer',
            p_email: user.email
          });

          console.log('DemoStreamer Auth - Is allowed:', isAllowed, 'for email:', user.email, 'error:', emailCheckError);

          if (!isAllowed) {
            setError({
              message: 'Your email is not authorized to access this dashboard. Please contact the administrator.',
              type: 'unauthorized'
            });
            setSession(null);
            setLoading(false);
            return;
          }

          // Check if user is admin (can access any dashboard)
          const { data: isAdminResult } = await supabase.rpc('is_admin_email', { 
            check_email: user.email 
          });

          if (isAdminResult) {
            // Admin user - can access demostreamer dashboard
            const { data: streamerData } = await supabase
              .from('streamers')
              .select('*')
              .eq('streamer_slug', 'demostreamer')
              .single();

            if (streamerData) {
              // Record login
              await supabase.rpc('record_streamer_login', {
                p_streamer_slug: 'demostreamer',
                p_email: user.email,
                p_provider: 'google'
              });

              const adminSession: DemoStreamerSession = {
                streamerId: streamerData.id,
                streamerSlug: streamerData.streamer_slug,
                streamerName: streamerData.streamer_name,
                brandColor: streamerData.brand_color,
                loginTime: new Date().toISOString(),
                isAdmin: true
              };
              setSession(adminSession);
            } else {
              setError({
                message: 'Demo Streamer configuration not found.',
                type: 'not_found'
              });
              setSession(null);
            }
          } else {
            // Regular user - check if they own the demostreamer streamer
            let { data: streamerData } = await supabase
              .from('streamers')
              .select('*')
              .eq('user_id', user.id)
              .eq('streamer_slug', 'demostreamer')
              .single();

            if (!streamerData) {
              // Attempt to securely link this streamer to the current user (if unclaimed)
              await supabase.rpc('link_streamer_to_current_user', { p_streamer_slug: 'demostreamer' });
              // Re-fetch after linking attempt
              const retry = await supabase
                .from('streamers')
                .select('*')
                .eq('user_id', user.id)
                .eq('streamer_slug', 'demostreamer')
                .single();
              streamerData = retry.data ?? null;
            }

            if (streamerData) {
              // Record login
              await supabase.rpc('record_streamer_login', {
                p_streamer_slug: 'demostreamer',
                p_email: user.email,
                p_provider: 'google'
              });

              const userSession: DemoStreamerSession = {
                streamerId: streamerData.id,
                streamerSlug: streamerData.streamer_slug,
                streamerName: streamerData.streamer_name,
                brandColor: streamerData.brand_color,
                loginTime: new Date().toISOString(),
                isAdmin: false
              };
              setSession(userSession);
            } else {
              setError({
                message: 'You are not authorized to access this dashboard.',
                type: 'unauthorized'
              });
              setSession(null);
            }
          }
        } else if (!authLoading) {
          setSession(null);
          setError(null);
        }
      } catch (error) {
        console.error('Error checking demostreamer session:', error);
        setError({
          message: 'An error occurred while checking authentication.',
          type: 'general'
        });
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
    error,
    logout,
    isAuthenticated: !!session
  };
};