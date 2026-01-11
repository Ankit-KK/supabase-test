import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Hash } from 'https://deno.land/x/checksum@1.4.0/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Deno-compatible Pusher client
class PusherClient {
  private appId: string;
  private key: string;
  private secret: string;
  private cluster: string;

  constructor(appId: string, key: string, secret: string, cluster: string) {
    this.appId = appId;
    this.key = key;
    this.secret = secret;
    this.cluster = cluster;
  }

  async trigger(channel: string, event: string, data: any) {
    const body = JSON.stringify({ name: event, data: JSON.stringify(data), channel });
    const timestamp = Math.floor(Date.now() / 1000);
    
    const hash = new Hash("md5");
    const bodyMd5 = hash.digest(new TextEncoder().encode(body)).hex();
    
    const authString = `POST\n/apps/${this.appId}/events\nauth_key=${this.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}`;
    const authSignature = await this.hmacSha256(authString, this.secret);
    
    const url = `https://api-${this.cluster}.pusher.com/apps/${this.appId}/events?auth_key=${this.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}&auth_signature=${authSignature}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pusher trigger failed: ${error}`);
    }

    return response.json();
  }

  private async hmacSha256(message: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);
    
    const key = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

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

    // Initialize Pusher with Deno-compatible client
    const pusher = new PusherClient(pusherAppId, pusherKey, pusherSecret, pusherCluster);

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
