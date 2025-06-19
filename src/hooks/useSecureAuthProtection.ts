
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSecureAuth } from "./useSecureAuth";

export interface SecureAuthProtectionOptions {
  redirectTo: string;
  requiredAdminType: string;
}

export const useSecureAuthProtection = (options: SecureAuthProtectionOptions) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, adminType, isLoading } = useSecureAuth();
  
  useEffect(() => {
    if (isLoading) return; // Wait for auth state to load
    
    if (!isAuthenticated || adminType !== options.requiredAdminType) {
      console.log("Secure auth protection: Access denied", { 
        isAuthenticated, 
        adminType, 
        required: options.requiredAdminType 
      });
      
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "Please log in with proper credentials to view this page",
      });
      navigate(options.redirectTo);
      return;
    }
    
    console.log("Secure auth protection: Access granted");
  }, [isAuthenticated, adminType, isLoading, options.requiredAdminType, options.redirectTo, navigate, toast]);
  
  return { 
    isAuthenticated: isAuthenticated && adminType === options.requiredAdminType,
    adminType,
    isLoading
  };
};
