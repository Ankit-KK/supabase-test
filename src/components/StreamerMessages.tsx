
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { getStreamerConfig } from "@/config/streamerConfigs";
import { StreamerTableName } from "@/types/donations";

// Import the existing DonationMessages component to reuse
import DonationMessages from "@/components/DonationMessages";

const StreamerMessages = () => {
  const { streamerName } = useParams<{ streamerName: string }>();
  const navigate = useNavigate();
  
  const config = getStreamerConfig(streamerName || "");
  
  if (!config) {
    return <div>Streamer not found</div>;
  }

  // Use the auth protection hook to guard this route
  useAuthProtection({
    redirectTo: `/${config.name}/login`,
    authKey: config.authKey
  });

  // Special styling for Rakazone
  if (config.name === "rakazone") {
    return (
      <div 
        className="container mx-auto py-8 px-4"
        style={{
          background: config.theme.backgroundColor,
          minHeight: "100vh",
        }}
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            {config.features.hasLogo && (
              <img 
                src={config.features.logoUrl} 
                alt={`${config.displayName} Logo`} 
                className="h-12 w-12"
              />
            )}
            <h1 className={`text-3xl font-bold text-${config.theme.primaryColor}`}>
              Donation Messages
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/${config.name}/dashboard`)} 
              className={`border-${config.theme.borderColor} hover:bg-red-900/20`}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        <DonationMessages tableName={config.tableName as StreamerTableName} />
      </div>
    );
  }

  // Default styling for other streamers
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Donation Messages</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(`/${config.name}/dashboard`)}>
            Back to Dashboard
          </Button>
        </div>
      </div>

      <DonationMessages tableName={config.tableName as StreamerTableName} />
    </div>
  );
};

export default StreamerMessages;
