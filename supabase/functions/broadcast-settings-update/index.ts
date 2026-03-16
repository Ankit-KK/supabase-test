import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";


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

  private md5(message: string): string {
    // Minimal MD5 implementation for Pusher body hash
    const k = [
      0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,0xa8304613,0xfd469501,
      0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,0x6b901122,0xfd987193,0xa679438e,0x49b40821,
      0xf61e2562,0xc040b340,0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,
      0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,0x676f02d9,0x8d2a4c8a,
      0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,
      0x289b7ec6,0xeaa127fa,0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,
      0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,0xffeff47d,0x85845dd1,
      0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391
    ];
    const s = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
    
    const bytes = new TextEncoder().encode(message);
    const bitLen = bytes.length * 8;
    const padLen = (bytes.length % 64 < 56) ? 56 - bytes.length % 64 : 120 - bytes.length % 64;
    const padded = new Uint8Array(bytes.length + padLen + 8);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(padded.length - 8, bitLen & 0xffffffff, true);
    view.setUint32(padded.length - 4, Math.floor(bitLen / 0x100000000), true);
    
    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    
    for (let i = 0; i < padded.length; i += 64) {
      const M = new Uint32Array(16);
      for (let j = 0; j < 16; j++) M[j] = view.getUint32(i + j * 4, true);
      let A = a0, B = b0, C = c0, D = d0;
      for (let j = 0; j < 64; j++) {
        let F: number, g: number;
        if (j < 16) { F = (B & C) | (~B & D); g = j; }
        else if (j < 32) { F = (D & B) | (~D & C); g = (5 * j + 1) % 16; }
        else if (j < 48) { F = B ^ C ^ D; g = (3 * j + 5) % 16; }
        else { F = C ^ (B | ~D); g = (7 * j) % 16; }
        F = (F + A + k[j] + M[g]) >>> 0;
        A = D; D = C; C = B;
        B = (B + ((F << s[j]) | (F >>> (32 - s[j])))) >>> 0;
      }
      a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
    }
    
    const hex = (n: number) => Array.from(new Uint8Array(new Uint32Array([n]).buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex(a0) + hex(b0) + hex(c0) + hex(d0);
  }

  async trigger(channel: string, event: string, data: any) {
    const body = JSON.stringify({ name: event, data: JSON.stringify(data), channel });
    const timestamp = Math.floor(Date.now() / 1000);
    
    const bodyMd5 = this.md5(body);
    
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

// Origin validation for CSRF protection
function validateOrigin(req: Request): Response | null {
  const origin = req.headers.get('origin');
  if (origin) {
    try {
      const url = new URL(origin);
      const allowed = url.hostname.endsWith('.lovable.app') ||
          url.hostname === 'hyperchat.site' || url.hostname === 'www.hyperchat.site' ||
          url.hostname === 'hyperchat.space' || url.hostname === 'www.hyperchat.space';
      if (!allowed) {
        console.warn('[broadcast-settings-update] Rejected origin:', origin);
        return new Response(
          JSON.stringify({ error: 'Forbidden: Invalid origin' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Invalid origin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // CSRF: Validate origin
    const originError = validateOrigin(req);
    if (originError) return originError;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // --- Authentication via custom session ---
    const authToken = req.headers.get("x-auth-token");
    const body = await req.json();
    const tokenToValidate = authToken || body.authToken;

    if (!tokenToValidate) {
      return new Response(
        JSON.stringify({ error: "Missing auth token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: session, error: sessionError } = await serviceClient.rpc(
      "validate_session_token",
      { plain_token: tokenToValidate }
    );

    if (sessionError || !session || session.length === 0) {
      console.error("[broadcast-settings-update] Session validation failed:", sessionError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = session[0].user_id;
    const { streamer_slug, settings } = body;

    if (!streamer_slug) {
      throw new Error("streamer_slug is required");
    }

    if (!settings || typeof settings !== "object") {
      throw new Error("settings object is required");
    }

    // Verify ownership
    const { data: streamer, error: streamerError } = await serviceClient
      .from("streamers")
      .select("pusher_group, user_id, streamer_slug")
      .eq("streamer_slug", streamer_slug)
      .single();

    if (streamerError || !streamer) {
      console.error(`[broadcast-settings-update] Streamer not found: ${streamer_slug}`, streamerError);
      throw new Error("Streamer not found");
    }

    // Check ownership or admin bypass
    let isAuthorized = streamer.user_id === userId;
    if (!isAuthorized) {
      const { data: userData } = await serviceClient
        .from("auth_users")
        .select("email")
        .eq("id", userId)
        .single();

      const { data: adminEntry } = await serviceClient
        .from("admin_emails")
        .select("email")
        .eq("email", userData?.email)
        .maybeSingle();

      isAuthorized = !!adminEntry;
      if (isAuthorized) {
        console.log(`[broadcast-settings-update] Admin bypass granted for ${userData?.email}`);
      }
    }

    if (!isAuthorized) {
      console.error(`[broadcast-settings-update] Forbidden: user ${userId} tried to broadcast for ${streamer_slug} owned by ${streamer.user_id}`);
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[broadcast-settings-update] Broadcasting for ${streamer_slug}:`, settings);

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

    const pusher = new PusherClient(pusherAppId, pusherKey, pusherSecret, pusherCluster);

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
