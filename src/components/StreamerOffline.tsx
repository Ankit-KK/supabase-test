
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WifiOff } from "lucide-react";

interface StreamerOfflineProps {
  streamerName: string;
}

const StreamerOffline: React.FC<StreamerOfflineProps> = ({ streamerName }) => {
  return (
    <Card className="w-full max-w-md mx-auto border-destructive">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <WifiOff className="h-12 w-12 text-destructive" />
        </div>
        <CardTitle className="text-2xl text-destructive">Streamer Offline</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground mb-2">
          {streamerName} is currently offline.
        </p>
        <p className="text-sm">
          Donations are only accepted when the streamer is live. 
          Please check back later or follow {streamerName} to know when they go live.
        </p>
      </CardContent>
    </Card>
  );
};

export default StreamerOffline;
