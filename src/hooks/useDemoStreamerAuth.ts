import { useState, useEffect } from 'react';
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
  type: string;
}

export const useDemoStreamerAuth = () => {
  const [session, setSession] = useState<DemoStreamerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Get current session
        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        if (!authSession?.user) {
          setSession(null);
          setError(null);
          return;
        }

        const userEmail = authSession.user.email;
        if (!userEmail) {
          setError({
            message: 'No email found in session',
            type: 'AUTH_ERROR'
          });
          return;
        }

        // Check if user is allowed to access demostreamer dashboard
        const { data: isAllowed, error: allowedError } = await supabase
          .rpc('check_streamer_email_allowed', {
            p_streamer_slug: 'demostreamer',
            p_email: userEmail
          });

        if (allowedError) {
          console.error('Error checking email permission:', allowedError);
          setError({
            message: 'Failed to verify access permissions',
            type: 'PERMISSION_ERROR'
          });
          return;
        }

        if (!isAllowed) {
          setError({
            message: 'You are not authorized to access the Demo Streamer dashboard',
            type: 'ACCESS_DENIED'
          });
          return;
        }

        // Check if user is admin
        const { data: isAdmin, error: adminError } = await supabase
          .rpc('is_admin_email', {
            check_email: userEmail
          });

        if (adminError) {
          console.error('Error checking admin status:', adminError);
        }

        let streamerData;

        if (isAdmin) {
          // Admin can access all streamers, get demostreamer specifically
          const { data: adminStreamers, error: adminError } = await supabase
            .rpc('get_admin_streamers', {
              admin_email: userEmail
            });

          if (adminError) {
            console.error('Error fetching admin streamers:', adminError);
            setError({
              message: 'Failed to fetch streamer data',
              type: 'DATA_ERROR'
            });
            return;
          }

          streamerData = adminStreamers?.find((s: any) => s.streamer_slug === 'demostreamer');
        } else {
          // Regular user, check if they own the demostreamer
          const { data: userStreamers, error: userError } = await supabase
            .from('streamers')
            .select('id, streamer_slug, streamer_name, brand_color')
            .eq('user_id', authSession.user.id)
            .eq('streamer_slug', 'demostreamer');

          if (userError) {
            console.error('Error fetching user streamers:', userError);
            setError({
              message: 'Failed to fetch streamer data',
              type: 'DATA_ERROR'
            });
            return;
          }

          streamerData = userStreamers?.[0];
        }

        if (!streamerData) {
          setError({
            message: 'Demo Streamer dashboard not found or not accessible',
            type: 'NOT_FOUND'
          });
          return;
        }

        // Record login
        try {
          await supabase.rpc('record_streamer_login', {
            p_streamer_slug: 'demostreamer',
            p_email: userEmail,
            p_provider: 'google'
          });
        } catch (loginError) {
          console.error('Error recording login:', loginError);
        }

        if (!mounted) return;

        setSession({
          streamerId: streamerData.id,
          streamerSlug: streamerData.streamer_slug,
          streamerName: streamerData.streamer_name,
          brandColor: streamerData.brand_color,
          loginTime: new Date().toISOString(),
          isAdmin: isAdmin || false
        });
        setError(null);

      } catch (err) {
        console.error('Authentication error:', err);
        if (mounted) {
          setError({
            message: 'An unexpected error occurred during authentication',
            type: 'UNKNOWN_ERROR'
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setError(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          checkAuth();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      setSession(null);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    session,
    loading,
    error,
    logout,
    isAuthenticated: !!session
  };
};