
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface AuthProtectionOptions {
  redirectTo: string;
  authKey: string;
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
  
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem(authKey) === "true";
    
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "Please log in to view this page",
      });
      navigate(redirectTo);
    }
  }, [navigate, redirectTo, toast, authKey]);
  
  return { isAuthenticated: sessionStorage.getItem(authKey) === "true" };
};
