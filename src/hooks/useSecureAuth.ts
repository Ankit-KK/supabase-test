
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecureAuthState {
  user: User | null;
  session: Session | null;
  adminType: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useSecureAuth = () => {
  const [authState, setAuthState] = useState<SecureAuthState>({
    user: null,
    session: null,
    adminType: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          try {
            // Get admin type through secure function
            const { data: adminType } = await supabase.rpc('get_user_admin_type');
            
            setAuthState({
              user: session.user,
              session,
              adminType: adminType || null,
              isAuthenticated: true,
              isLoading: false,
            });

            // Log authentication event
            await supabase.rpc('log_access_attempt', {
              p_action: `AUTH_STATE_CHANGE_${event}`,
              p_table_name: 'admin_users'
            });
          } catch (error) {
            console.error('Auth state error:', error);
            setAuthState({
              user: null,
              session: null,
              adminType: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } else {
          setAuthState({
            user: null,
            session: null,
            adminType: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    );

    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: adminType } = await supabase.rpc('get_user_admin_type');
          
          setAuthState({
            user: session.user,
            session,
            adminType: adminType || null,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Session check error:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.rpc('log_access_attempt', {
        p_action: 'LOGOUT',
        p_table_name: 'admin_users'
      });
      
      await supabase.auth.signOut();
      
      // Clear any cached tokens
      sessionStorage.removeItem('chiaa_gaming_obs_token');
      sessionStorage.removeItem('ankit_obs_token');
      
      toast({
        title: "Logged out",
        description: "You have been securely logged out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "Logout error",
        description: "There was an issue logging out.",
      });
    }
  };

  return {
    ...authState,
    signOut,
  };
};
