
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logSecurityEvent } from '@/utils/rateLimiting';

interface SecureDataDisplayProps {
  children: React.ReactNode;
  requiredAuth?: boolean;
}

const SecureDataDisplay: React.FC<SecureDataDisplayProps> = ({ 
  children, 
  requiredAuth = true 
}) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        if (!requiredAuth) {
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }

        // Check if user is authenticated
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth check error:', error);
          await logSecurityEvent('AUTH_CHECK_ERROR', error.message);
          setIsAuthorized(false);
        } else if (session?.user) {
          setIsAuthorized(true);
          await logSecurityEvent('AUTHORIZED_ACCESS', `User: ${session.user.email}`);
        } else {
          // Check session storage as fallback for existing login system
          const hasValidSession = 
            sessionStorage.getItem("chiaaGamingAuth") === "true" ||
            sessionStorage.getItem("ankitAuth") === "true" ||
            sessionStorage.getItem("chiaaGamingModAuth") === "true";
          
          setIsAuthorized(hasValidSession);
          
          if (!hasValidSession) {
            await logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', 'No valid session');
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: "You are not authorized to view this content.",
            });
          }
        }
      } catch (error) {
        console.error('Authorization check failed:', error);
        await logSecurityEvent('AUTH_SYSTEM_ERROR', error instanceof Error ? error.message : 'Unknown error');
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [requiredAuth, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Verifying access...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">You are not authorized to view this content.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SecureDataDisplay;
