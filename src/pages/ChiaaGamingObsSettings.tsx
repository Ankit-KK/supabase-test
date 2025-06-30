
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Settings } from "lucide-react";
import ObsSettings from "@/components/ObsSettings";
import SecureDataDisplay from "@/components/SecureDataDisplay";
import { logSecurityEvent } from "@/utils/rateLimiting";

const ChiaaGamingObsSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = sessionStorage.getItem("chiaaGamingAuth") === "true";
    if (!isAuthenticated) {
      logSecurityEvent('UNAUTHORIZED_OBS_SETTINGS_ACCESS', 'chiaa_gaming_obs_settings');
      navigate("/chiaa_gaming/login");
      return;
    }
  }, [navigate]);

  const handleBackToDashboard = () => {
    navigate("/chiaa_gaming/dashboard");
  };

  return (
    <SecureDataDisplay requiredAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-black p-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleBackToDashboard}
                className="border-pink-500/50 text-pink-100 hover:bg-pink-500/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-pink-100 flex items-center gap-2">
                  <Settings className="w-8 h-8" />
                  OBS Settings
                </h1>
                <p className="text-pink-300">Configure your streaming overlay settings</p>
              </div>
            </div>
          </div>

          {/* OBS Settings Component */}
          <ObsSettings />
        </div>
      </div>
    </SecureDataDisplay>
  );
};

export default ChiaaGamingObsSettings;
