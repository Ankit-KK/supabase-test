
import React from "react";
import { useParams } from "react-router-dom";
import { getStreamerConfig } from "@/config/streamerConfigs";
import { StreamerTableName } from "@/types/donations";

// Import the existing ObsView component to reuse
import ObsView from "@/components/ObsView";

const StreamerObsView = () => {
  const { streamerName, id } = useParams<{ streamerName: string; id: string }>();
  
  const config = getStreamerConfig(streamerName || "");
  
  if (!config) {
    return <div>Streamer not found</div>;
  }

  return (
    <ObsView 
      tableName={config.tableName as StreamerTableName}
      donationId={id || "latest"}
      streamerConfig={config}
    />
  );
};

export default StreamerObsView;
