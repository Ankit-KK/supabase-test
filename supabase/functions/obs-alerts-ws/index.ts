import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory store for active WebSocket connections
const activeConnections = new Map<string, WebSocket>();

// WebSocket message types
interface WebSocketMessage {
  type: 'donation_approved' | 'connection_ack' | 'error';
  streamer_slug?: string;
  donation?: {
    id: string;
    name: string;
    amount: number;
    message?: string;
    is_hyperemote: boolean;
    voice_message_url?: string;
    created_at: string;
  };
  message?: string;
}

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Check if this is a WebSocket upgrade request or HTTP broadcast request
  if (upgradeHeader.toLowerCase() === "websocket") {
    // Handle WebSocket connection for OBS browser source
    return handleWebSocketConnection(req);
  } else {
    // Handle HTTP broadcast request from approval functions
    return handleBroadcastRequest(req);
  }
});

async function handleBroadcastRequest(req: Request) {
  try {
    const { streamer_slug, donation } = await req.json();
    
    if (!streamer_slug || !donation) {
      throw new Error("Missing required parameters");
    }

    console.log('📢 Alert broadcast request:', { streamer_slug, donationId: donation.id });
    
    const success = await broadcastAlert(streamer_slug, donation);

    return new Response(
      JSON.stringify({
        success,
        message: success ? "Alert broadcast successful" : "Alert broadcast failed"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error broadcasting alert:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
}

async function handleWebSocketConnection(req: Request) {
  // Get OBS token from URL parameters
  const url = new URL(req.url);
  const obsToken = url.searchParams.get("token");

  if (!obsToken) {
    return new Response("Missing OBS token", { status: 400 });
  }

  console.log('🔌 WebSocket connection attempt with token:', obsToken);

  // Validate OBS token
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const { data: tokenValidation, error } = await supabase
    .rpc('validate_obs_token_secure', { token_to_check: obsToken });

  if (error || !tokenValidation || !tokenValidation[0]?.is_valid) {
    console.log('❌ Invalid OBS token:', obsToken);
    return new Response("Invalid OBS token", { status: 401 });
  }

  const streamerData = tokenValidation[0];
  const connectionKey = `${streamerData.streamer_slug}-${streamerData.streamer_id}`;
  
  console.log('✅ Valid token for streamer:', streamerData.streamer_name, 'Slug:', streamerData.streamer_slug);

  // Upgrade to WebSocket
  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    // Store the connection
    activeConnections.set(connectionKey, socket);
    console.log('🚀 WebSocket connected for:', streamerData.streamer_name, 'Total connections:', activeConnections.size);

    // Send connection acknowledgment
    const ackMessage: WebSocketMessage = {
      type: 'connection_ack',
      streamer_slug: streamerData.streamer_slug,
      message: `Connected to ${streamerData.streamer_name} alerts`
    };
    socket.send(JSON.stringify(ackMessage));
  };

  socket.onclose = () => {
    activeConnections.delete(connectionKey);
    console.log('🔌 WebSocket disconnected for:', streamerData.streamer_name, 'Total connections:', activeConnections.size);
  };

  socket.onerror = (err) => {
    console.error('❌ WebSocket error for:', streamerData.streamer_name, err);
    activeConnections.delete(connectionKey);
  };

  return response;
}

// Function to broadcast alerts to active connections
async function broadcastAlert(streamerSlug: string, donation: any) {
  console.log('🔔 Broadcasting alert for:', streamerSlug, 'Donor:', donation.name);
  
  const connectionKey = `${streamerSlug}-${donation.streamer_id}`;
  const connection = activeConnections.get(connectionKey);
  
  if (!connection) {
    console.log('📡 No active WebSocket connection for:', streamerSlug);
    return false;
  }

  const alertMessage: WebSocketMessage = {
    type: 'donation_approved',
    streamer_slug: streamerSlug,
    donation: {
      id: donation.id,
      name: donation.name,
      amount: donation.amount,
      message: donation.message,
      is_hyperemote: donation.is_hyperemote || false,
      voice_message_url: donation.voice_message_url,
      created_at: donation.created_at
    }
  };

  try {
    connection.send(JSON.stringify(alertMessage));
    console.log('📤 Alert broadcast successfully to:', streamerSlug, 'Donor:', donation.name);
    return true;
  } catch (error) {
    console.error('❌ Failed to broadcast alert to:', streamerSlug, error);
    // Remove dead connection
    activeConnections.delete(connectionKey);
    return false;
  }
}