import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import Pusher from "https://esm.sh/pusher@5.1.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { streamer_slug, settings } = await req.json();

    if (!streamer_slug) {
      throw new Error("streamer_slug is required");
    }

    if (!settings || typeof settings !== "object") {
      throw new Error("settings object is required");
    }

    console.log(`[broadcast-settings-update] Broadcasting for ${streamer_slug}:`, settings);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch pusher_group for this streamer
    const { data: streamer, error } = await supabase
      .from("streamers")
      .select("pusher_group")
      .eq("streamer_slug", streamer_slug)
      .single();

    if (error || !streamer) {
      console.error(`[broadcast-settings-update] Streamer not found: ${streamer_slug}`, error);
      throw new Error("Streamer not found");
    }

    const group = streamer.pusher_group || 1;
    console.log(`[broadcast-settings-update] ${streamer_slug} → Pusher Group ${group}`);

    // Get Pusher credentials for this group
    const pusherAppId = Deno.env.get(`PUSHER_APP_ID_${group}`);
    const pusherKey = Deno.env.get(`PUSHER_KEY_${group}`);
    const pusherSecret = Deno.env.get(`PUSHER_SECRET_${group}`);
    const pusherCluster = Deno.env.get(`PUSHER_CLUSTER_${group}`);

    if (!pusherAppId || !pusherKey || !pusherSecret || !pusherCluster) {
      console.error(`[broadcast-settings-update] Missing Pusher credentials for Group ${group}`);
      throw new Error("Pusher configuration incomplete");
    }

    // Initialize Pusher
    const pusher = new Pusher({
      appId: pusherAppId,
      key: pusherKey,
      secret: pusherSecret,
      cluster: pusherCluster,
      useTLS: true,
    });

    // Broadcast settings update on the settings channel
    const channelName = `${streamer_slug}-settings`;
    
    await pusher.trigger(channelName, "settings-updated", {
      leaderboard_widget_enabled: settings.leaderboard_widget_enabled,
      brand_color: settings.brand_color,
      alert_box_scale: settings.alert_box_scale,
      timestamp: new Date().toISOString(),
    });

    console.log(`[broadcast-settings-update] Sent to channel: ${channelName}`);

    return new Response(
      JSON.stringify({
        success: true,
        channel: channelName,
        settings,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[broadcast-settings-update] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
