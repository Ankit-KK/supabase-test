
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
  
  // Handle both string and options object for backward compatibility
  const authKey = typeof options === 'string' ? options : options.authKey;
  const redirectTo = typeof options === 'string' 
    ? `/${options}/login` 
    : options.redirectTo;
  const requiredAdminType = typeof options === 'object' ? options.requiredAdminType : null;
  
  useEffect(() => {
    console.log("useAuthProtection: Checking authentication for", authKey);
    
    // Check session storage for authentication - using consistent key names
    const isAuthenticated = sessionStorage.getItem(`${authKey}Auth`) === 'true';
    const isAdmin = sessionStorage.getItem(`${authKey}AdminAuth`) === 'true';
    
    console.log("useAuthProtection: isAuthenticated =", isAuthenticated, "isAdmin =", isAdmin);

    if (!isAuthenticated) {
      console.log("useAuthProtection: Not authenticated, redirecting to", redirectTo);
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "Please log in to view this page",
      });
      navigate(redirectTo);
      return;
    }

    if (requiredAdminType && !isAdmin) {
      console.log("useAuthProtection: Admin access required but not granted");
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "You don't have permission to access this page",
      });
      navigate(redirectTo);
      return;
    }
    
    console.log("useAuthProtection: Authentication check passed");
  }, [authKey, redirectTo, requiredAdminType, navigate, toast]);
  
  // Return current auth status
  const isAuthenticated = sessionStorage.getItem(`${authKey}Auth`) === 'true';
  const isAdmin = sessionStorage.getItem(`${authKey}AdminAuth`) === 'true';
  
  return { 
    isAuthenticated,
    adminType: isAuthenticated ? authKey : null,
    isLoading: false
  };
};
