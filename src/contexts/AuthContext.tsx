
import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  adminType: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [adminType, setAdminType] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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

    // Check if admin is logged in via session storage - simplified approach
    const checkAdminStatus = () => {
      const adminTypes = ['ankit', 'chiaa_gaming', 'harish', 'mackle'];
      let foundAdmin = false;
      
      for (const type of adminTypes) {
        if (sessionStorage.getItem(`${type}Auth`) === 'true') {
          setIsAdmin(true);
          setAdminType(type);
          foundAdmin = true;
          break;
        }
      }
      
      if (!foundAdmin && !session) {
        setIsAdmin(false);
        setAdminType(null);
      }
    };
    
    checkAdminStatus();
    window.addEventListener('storage', checkAdminStatus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', checkAdminStatus);
    };
  }, [session]);

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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
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
      
      // Clear session storage - using consistent key names
      const adminTypes = ['ankit', 'chiaa_gaming', 'harish', 'mackle'];
      adminTypes.forEach(type => {
        sessionStorage.removeItem(`${type}Auth`);
        sessionStorage.removeItem(`${type}AdminAuth`);
      });
      
      // Reset state
      setAdminType(null);
      setIsAdmin(false);
      
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
    isAdmin,
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
