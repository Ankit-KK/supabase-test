
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hasStreamerSession } from "@/utils/streamerAuth";

interface AuthProtectionOptions {
  redirectTo: string;
  authKey: "ankitAuth" | "harishAuth";
}

export const useAuthProtection = ({ redirectTo, authKey }: AuthProtectionOptions) => {
  const navigate = useNavigate();
  const streamerType = authKey === "ankitAuth" ? "ankit" : "harish";

  useEffect(() => {
    // Check if user is authenticated
    if (!hasStreamerSession(streamerType)) {
      // Redirect to login page if not authenticated
      navigate(redirectTo);
    }
  }, [navigate, redirectTo, streamerType]);
};
