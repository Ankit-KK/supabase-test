
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { hasStreamerSession, checkStreamerStatus } from "@/utils/streamerAuth";

interface AuthProtectionOptions {
  redirectTo: string;
  authKey: "ankitAuth" | "harishAuth";
}

export const useAuthProtection = ({ redirectTo, authKey }: AuthProtectionOptions) => {
  const navigate = useNavigate();
  const streamerType = authKey === "ankitAuth" ? "ankit" : "harish";
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Check if user is authenticated in session storage
      const hasSession = hasStreamerSession(streamerType);
      
      // Double-check against database for extra security
      if (hasSession) {
        const status = await checkStreamerStatus(streamerType);
        
        // If not authenticated or streamer is not marked as online in the database
        if (!status.isOnline) {
          console.log(`Auth protection: ${streamerType} session exists but not online in DB, redirecting`);
          navigate(redirectTo);
          return;
        }
        
        setIsAuthenticated(true);
      } else {
        console.log(`Auth protection: No ${streamerType} session, redirecting`);
        navigate(redirectTo);
      }
    };
    
    checkAuth();
  }, [navigate, redirectTo, streamerType]);
  
  return { isAuthenticated };
};
