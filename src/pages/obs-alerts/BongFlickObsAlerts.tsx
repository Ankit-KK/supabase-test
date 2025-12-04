import { useState, useEffect } from "react";
import { usePusherConfig } from "@/hooks/usePusherConfig";
import { usePusherAlerts } from "@/hooks/usePusherAlerts";
import { BongFlickAlertDisplay } from "@/components/BongFlickAlertDisplay";
import { supabase } from "@/integrations/supabase/client";

const BongFlickObsAlerts = () => {
  const [alertBoxScale, setAlertBoxScale] = useState<number>(1.0);
  const { config, loading, error } = usePusherConfig("bongflick");
  
  const { currentAlert, isVisible } = usePusherAlerts({
    pusherKey: config?.key || "",
    pusherCluster: config?.cluster || "",
    channelName: "bongflick-alerts",
    delayBeforeDisplay: 60000,
    alertDuration: { text: 5000, hyperemote: 8000, voice: 15000 },
  });

  useEffect(() => {
    const fetchScale = async () => {
      const { data, error } = await supabase
        .from('streamers')
        .select('alert_box_scale')
        .eq('streamer_slug', 'bongflick')
        .single();
      
      if (!error && data?.alert_box_scale) {
        setAlertBoxScale(Number(data.alert_box_scale));
      }
    };
    fetchScale();

    const channel = supabase
      .channel('bongflick-settings')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'streamers',
        filter: 'streamer_slug=eq.bongflick'
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
        <BongFlickAlertDisplay donation={currentAlert} scale={alertBoxScale} />
      )}
    </div>
  );
};

export default BongFlickObsAlerts;
