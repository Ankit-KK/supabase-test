import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ChiaSession {
  streamerId: string;
  streamerSlug: string;
  streamerName: string;
  brandColor: string;
  loginTime: number;
  isAdmin?: boolean;
}

interface AuthError {
  message: string;
  type: 'unauthorized' | 'not_found' | 'general';
}

export const useChiaAuth = () => {
  const [session, setSession] = useState<ChiaSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const { user, session: authSession, loading: authLoading } = useAuth();
  const isChecking = useRef(false);

  useEffect(() => {
    const checkSession = async () => {
      if (isChecking.current) return;
      isChecking.current = true;
      
      try {
        setError(null);
        
        // Only check for Google OAuth authenticated users
        if (user && authSession && !authLoading) {
          // Check if this email is allowed to access the chia gaming dashboard
          const { data: isAllowed } = await supabase.rpc('check_streamer_email_allowed', {
            p_streamer_slug: 'chia_gaming',
            p_email: user.email
          });

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
            // Admin user - can access chia gaming dashboard
            const { data: streamerData } = await supabase
              .from('streamers')
              .select('*')
              .eq('streamer_slug', 'chia_gaming')
              .single();

            if (streamerData) {
              // Record login
              await supabase.rpc('record_streamer_login', {
                p_streamer_slug: 'chia_gaming',
                p_email: user.email,
                p_provider: 'google'
              });

              const adminSession: ChiaSession = {
                streamerId: streamerData.id,
                streamerSlug: streamerData.streamer_slug,
                streamerName: streamerData.streamer_name,
                brandColor: streamerData.brand_color,
                loginTime: Date.now(),
                isAdmin: true
              };
              setSession(adminSession);
            } else {
              setError({
                message: 'Chia Gaming streamer configuration not found.',
                type: 'not_found'
              });
              setSession(null);
            }
          } else {
            // Regular user - check email permissions first
            if (isAllowed) {
              // User has email permission, use secure function to get streamer data
              const { data: streamerData } = await supabase.rpc('get_public_streamer_data', {
                p_streamer_slug: 'chia_gaming'
              });

              if (streamerData && streamerData.length > 0) {
                const streamer = streamerData[0];
                
                // Record login
                await supabase.rpc('record_streamer_login', {
                  p_streamer_slug: 'chia_gaming',
                  p_email: user.email,
                  p_provider: 'google'
                });

                const userSession: ChiaSession = {
                  streamerId: streamer.id,
                  streamerSlug: streamer.streamer_slug,
                  streamerName: streamer.streamer_name,
                  brandColor: streamer.brand_color,
                  loginTime: Date.now(),
                  isAdmin: false
                };
                setSession(userSession);
              } else {
                setError({
                  message: 'Chia Gaming streamer configuration not found.',
                  type: 'not_found'
                });
                setSession(null);
              }
            } else {
              // No email permission, try ownership-based access using secure function
              const { data: linkResult } = await supabase.rpc('link_streamer_to_current_user', { 
                p_streamer_slug: 'chia_gaming' 
              });

              if (linkResult && linkResult.length > 0 && linkResult[0].linked) {
                // Successfully linked or already owned, get streamer data
                const { data: streamerData } = await supabase.rpc('get_public_streamer_data', {
                  p_streamer_slug: 'chia_gaming'
                });

                if (streamerData && streamerData.length > 0) {
                  const streamer = streamerData[0];
                  
                  // Record login
                  await supabase.rpc('record_streamer_login', {
                    p_streamer_slug: 'chia_gaming',
                    p_email: user.email,
                    p_provider: 'google'
                  });

                  const userSession: ChiaSession = {
                    streamerId: streamer.id,
                    streamerSlug: streamer.streamer_slug,
                    streamerName: streamer.streamer_name,
                    brandColor: streamer.brand_color,
                    loginTime: Date.now(),
                    isAdmin: false
                  };
                  setSession(userSession);
                } else {
                  setError({
                    message: 'Chia Gaming streamer configuration not found.',
                    type: 'not_found'
                  });
                  setSession(null);
                }
              } else {
                setError({
                  message: 'You are not authorized to access this dashboard.',
                  type: 'unauthorized'
                });
                setSession(null);
              }
            }

          }
        } else if (!authLoading) {
          setSession(null);
          setError(null);
        }
      } catch (error) {
        console.error('Error checking chia session:', error);
        setError({
          message: 'An error occurred while checking authentication.',
          type: 'general'
        });
        setSession(null);
      } finally {
        isChecking.current = false;
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