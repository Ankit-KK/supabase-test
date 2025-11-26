import { usePusherConfig } from "@/hooks/usePusherConfig";
import { usePusherAlerts } from "@/hooks/usePusherAlerts";
import { NotYourKweenAlertDisplay } from "@/components/NotYourKweenAlertDisplay";

const NotYourKweenObsAlerts = () => {
  const { config, loading, error } = usePusherConfig("notyourkween");
  
  const { currentAlert, isVisible } = usePusherAlerts({
    pusherKey: config?.key || "",
    pusherCluster: config?.cluster || "",
    channelName: "notyourkween-alerts",
    delayBeforeDisplay: 60000,
    alertDuration: { text: 5000, hyperemote: 8000, voice: 15000 },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading configuration...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {isVisible && currentAlert && (
        <NotYourKweenAlertDisplay donation={currentAlert} />
      )}
    </div>
  );
};

export default NotYourKweenObsAlerts;
