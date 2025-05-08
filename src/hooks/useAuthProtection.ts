
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
export const useAuthProtection = ({ redirectTo, authKey }: AuthProtectionOptions) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
