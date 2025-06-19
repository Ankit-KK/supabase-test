
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface AuthProtectionOptions {
  redirectTo: string;
  authKey: string;
  requiredAdminType?: string;
}

/**
 * A hook to protect routes that require authentication
 */
export const useAuthProtection = (options: AuthProtectionOptions | string) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, adminType, isLoading } = useAuth();
  
  // Handle both string and options object for backward compatibility
  const authKey = typeof options === 'string' ? options : options.authKey;
  const redirectTo = typeof options === 'string' 
    ? `/${options}/login` 
    : options.redirectTo;
  const requiredAdminType = typeof options === 'object' ? options.requiredAdminType : null;
  
  useEffect(() => {
    if (isLoading) return; // Wait for auth to load
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "Please log in to view this page",
      });
      navigate(redirectTo);
      return;
    }

    if (requiredAdminType && adminType !== requiredAdminType && adminType !== 'admin') {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "You don't have permission to access this page",
      });
      navigate(redirectTo);
      return;
    }
  }, [user, adminType, isLoading, navigate, redirectTo, toast, requiredAdminType]);
  
  return { 
    isAuthenticated: !!user && !isLoading,
    adminType,
    isLoading
  };
};
