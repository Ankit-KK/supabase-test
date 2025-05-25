
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { isAdminAuthenticated } from "@/services/streamerAuth";

/**
 * A hook to protect admin routes that require admin authentication
 */
export const useAdminAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    // Check if any admin user is authenticated with admin privileges
    const adminTypes = ['ankit', 'harish', 'mackle', 'rakazone', 'chiaa_gaming'];
    const hasAdminAuth = adminTypes.some(type => isAdminAuthenticated(type));
    
    if (!hasAdminAuth) {
      toast({
        variant: "destructive",
        title: "Admin access required",
        description: "Please log in with admin credentials to access this page",
      });
      navigate("/admin/login");
    }
  }, [navigate, toast]);
  
  // Return whether user has admin authentication
  const adminTypes = ['ankit', 'harish', 'mackle', 'rakazone', 'chiaa_gaming'];
  const hasAdminAuth = adminTypes.some(type => isAdminAuthenticated(type));
  
  return { isAdminAuthenticated: hasAdminAuth };
};
