import { useState, useEffect } from "react";
import { usePusherConfig } from "@/hooks/usePusherConfig";
import { usePusherAlerts } from "@/hooks/usePusherAlerts";
import { NotYourKweenAlertDisplay } from "@/components/NotYourKweenAlertDisplay";
import { supabase } from "@/integrations/supabase/client";

const NotYourKweenObsAlerts = () => {
  const [alertBoxScale, setAlertBoxScale] = useState<number>(1.0);
  const { config, loading, error } = usePusherConfig("notyourkween");
  
  const { currentAlert, isVisible } = usePusherAlerts({
    pusherKey: config?.key || "",
    pusherCluster: config?.cluster || "",
    channelName: "notyourkween-alerts",
    delayBeforeDisplay: 60000,
    alertDuration: { text: 5000, hyperemote: 8000, voice: 15000 },
  });

  useEffect(() => {
    const fetchScale = async () => {
      const { data, error } = await supabase
        .from('streamers')
        .select('alert_box_scale')
        .eq('streamer_slug', 'notyourkween')
        .single();
      
      if (!error && data?.alert_box_scale) {
        setAlertBoxScale(Number(data.alert_box_scale));
      }
    };
    fetchScale();

    const channel = supabase
      .channel('notyourkween-settings')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'streamers',
        filter: 'streamer_slug=eq.notyourkween'
      }, (payload: any) => {
        if (payload.new?.alert_box_scale) {
          setAlertBoxScale(Number(payload.new.alert_box_scale));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
        <NotYourKweenAlertDisplay donation={currentAlert} scale={alertBoxScale} />
      )}
    </div>
  );
};

export default NotYourKweenObsAlerts;
