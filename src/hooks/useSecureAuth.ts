
import { useState, useEffect, useRef } from 'react';
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
  const initializedRef = useRef(false);
  const adminTypeCache = useRef<Record<string, string>>({});

  const fetchAdminType = async (session: Session): Promise<string | null> => {
    const email = session.user.email;
    if (!email) return null;
    
    // Check cache first
    if (adminTypeCache.current[email]) {
      console.log("Using cached admin type for:", email);
      return adminTypeCache.current[email];
    }
    
    try {
      console.log("Fetching admin type for user:", email);
      
      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('admin_type')
        .eq('user_email', email)
        .single();
      
      if (error) {
        console.error('Error fetching admin type:', error);
        return null;
      }
      
      const adminType = adminData?.admin_type || null;
      console.log("Admin type fetched:", adminType);
      
      // Cache the result
      if (adminType) {
        adminTypeCache.current[email] = adminType;
      }
      
      return adminType;
    } catch (error) {
      console.error('Exception fetching admin type:', error);
      return null;
    }
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    console.log("Initializing secure auth hook");

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change:", event, session?.user?.email);
        
        if (session?.user) {
          try {
            const adminType = await fetchAdminType(session);
            
            setAuthState({
              user: session.user,
              session,
              adminType: adminType || null,
              isAuthenticated: true,
              isLoading: false,
            });

            // Log authentication event (but don't let it block auth flow)
            try {
              await supabase.rpc('log_access_attempt', {
                p_action: `AUTH_STATE_CHANGE_${event}`,
                p_table_name: 'admin_users'
              });
            } catch (logError) {
              console.warn('Failed to log auth event:', logError);
            }
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

    // Check for existing session once
    const checkSession = async () => {
      try {
        console.log("Checking existing session");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const adminType = await fetchAdminType(session);
          
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

    return () => {
      subscription.unsubscribe();
      initializedRef.current = false;
      adminTypeCache.current = {};
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.rpc('log_access_attempt', {
        p_action: 'LOGOUT',
        p_table_name: 'admin_users'
      });
      
      await supabase.auth.signOut();
      
      // Clear cache and tokens
      adminTypeCache.current = {};
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
