
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

// Global state to prevent multiple hook instances from conflicting
let globalInitialized = false;
let globalAuthState: SecureAuthState = {
  user: null,
  session: null,
  adminType: null,
  isAuthenticated: false,
  isLoading: true,
};
let globalStateListeners: Array<(state: SecureAuthState) => void> = [];
let adminTypeCache: Record<string, string> = {};

export const useSecureAuth = () => {
  const [authState, setAuthState] = useState<SecureAuthState>(globalAuthState);
  const { toast } = useToast();
  const instanceIdRef = useRef(Math.random().toString(36));

  // Register this hook instance as a listener
  useEffect(() => {
    const instanceId = instanceIdRef.current;
    console.log(`Registering auth hook instance: ${instanceId}`);
    
    const listener = (state: SecureAuthState) => {
      setAuthState(state);
    };
    
    globalStateListeners.push(listener);
    
    // If already initialized, sync state immediately
    if (globalInitialized) {
      setAuthState(globalAuthState);
    }
    
    return () => {
      console.log(`Unregistering auth hook instance: ${instanceId}`);
      globalStateListeners = globalStateListeners.filter(l => l !== listener);
    };
  }, []);

  // Only initialize once globally
  useEffect(() => {
    if (globalInitialized) return;
    
    globalInitialized = true;
    console.log("Initializing global secure auth state");

    const updateGlobalState = (newState: Partial<SecureAuthState>) => {
      globalAuthState = { ...globalAuthState, ...newState };
      globalStateListeners.forEach(listener => listener(globalAuthState));
    };

    const fetchAdminType = async (session: Session): Promise<string | null> => {
      const email = session.user.email;
      if (!email) return null;
      
      // Check cache first
      if (adminTypeCache[email]) {
        console.log("Using cached admin type for:", email);
        return adminTypeCache[email];
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
          adminTypeCache[email] = adminType;
        }
        
        return adminType;
      } catch (error) {
        console.error('Exception fetching admin type:', error);
        return null;
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Global auth state change:", event, session?.user?.email);
        
        if (session?.user) {
          try {
            const adminType = await fetchAdminType(session);
            
            updateGlobalState({
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
            updateGlobalState({
              user: null,
              session: null,
              adminType: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } else {
          updateGlobalState({
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
          
          updateGlobalState({
            user: session.user,
            session,
            adminType: adminType || null,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          updateGlobalState({ isLoading: false });
        }
      } catch (error) {
        console.error('Session check error:', error);
        updateGlobalState({ isLoading: false });
      }
    };

    checkSession();

    // Cleanup function
    const cleanup = () => {
      subscription.unsubscribe();
      globalInitialized = false;
      adminTypeCache = {};
      globalAuthState = {
        user: null,
        session: null,
        adminType: null,
        isAuthenticated: false,
        isLoading: true,
      };
      globalStateListeners = [];
    };

    // Store cleanup function globally
    (window as any).__secureAuthCleanup = cleanup;
    
    return cleanup;
  }, []);

  const signOut = async () => {
    try {
      await supabase.rpc('log_access_attempt', {
        p_action: 'LOGOUT',
        p_table_name: 'admin_users'
      });
      
      await supabase.auth.signOut();
      
      // Clear cache and tokens
      adminTypeCache = {};
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
