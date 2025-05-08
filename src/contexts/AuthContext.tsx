import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  adminType: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [adminType, setAdminType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Make sure we create these admin users in the database if they don't exist yet
  useEffect(() => {
    const createDefaultAdminUsers = async () => {
      try {
        // Only attempt to create admin users if we have an authenticated session
        // This prevents the 401 Unauthorized error
        if (!session?.access_token) {
          console.log("Skipping admin user creation - no authenticated session");
          return;
        }

        const { data, error: checkError } = await supabase
          .from('admin_users')
          .select('user_email')
          .limit(1);
        
        if (checkError) {
          console.error("Error checking for admin users:", checkError.message);
          return;
        }
        
        if (!data || data.length === 0) {
          // Create default admin users
          const adminUsers = [
            { user_email: 'ankitashuk20@gmail.com', admin_type: 'ankit' },
            { user_email: 'harishk0294@gmail.com', admin_type: 'harish' }
          ];
          
          for (const user of adminUsers) {
            const { error: insertError } = await supabase
              .from('admin_users')
              .upsert(user, { onConflict: 'user_email' });
              
            if (insertError) {
              console.error(`Error creating admin user ${user.user_email}:`, insertError.message);
            }
          }
        }
      } catch (err) {
        console.error("Error setting up admin users:", err);
      }
    };
    
    // Only try to create admin users after we have a session
    if (session) {
      createDefaultAdminUsers();
    }
  }, [session]); // Depend on session to ensure we have authentication

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Fetch admin type after auth change
        if (currentSession?.user) {
          fetchAdminType(currentSession.user.email);
        } else {
          setAdminType(null);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user?.email) {
        fetchAdminType(currentSession.user.email);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAdminType = async (email: string | undefined) => {
    if (!email) return;
    
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('admin_type')
        .eq('user_email', email)
        .single();

      if (error) {
        console.error('Error fetching admin type:', error);
        setAdminType(null);
        return;
      }

      setAdminType(data.admin_type);
    } catch (error) {
      console.error('Error in fetchAdminType:', error);
      setAdminType(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Create the user first if it doesn't exist
      const { data: userCheckData } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!userCheckData.user) {
        // User doesn't exist, try to create it
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;
        
        // Try to sign in again after creating the user
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
      
      toast({
        title: "Login successful",
        description: "You have been logged in successfully.",
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "An error occurred during login.",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error.message || "An error occurred during logout.",
      });
    }
  };

  const value = {
    session,
    user,
    adminType,
    isLoading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
