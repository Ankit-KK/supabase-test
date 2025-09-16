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
  const url = new URL(req.url);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Manual test endpoint for debugging
  if (url.pathname.includes('/test-alert')) {
    return handleTestAlert(req);
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

async function handleTestAlert(req: Request) {
  try {
    const { streamer_slug } = await req.json();
    
    // Create a test donation
    const testDonation = {
      id: "test-" + Date.now(),
      name: "Test Donor",
      amount: 10,
      message: "This is a test alert!",
      is_hyperemote: false,
      voice_message_url: null,
      created_at: new Date().toISOString(),
      streamer_id: "test-streamer-id"
    };

    console.log('🧪 Test alert broadcast request:', { streamer_slug, donation: testDonation });
    
    const success = await broadcastAlert(streamer_slug || 'ankit', testDonation);

    return new Response(
      JSON.stringify({
        success,
        message: success ? "Test alert broadcast successful" : "Test alert broadcast failed",
        activeConnections: activeConnections.size,
        connectionKeys: Array.from(activeConnections.keys())
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error broadcasting test alert:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        activeConnections: activeConnections.size
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
}

async function handleBroadcastRequest(req: Request) {
  try {
    const body = await req.json();
    const { streamer_slug, donation, test } = body;
    
    // Handle test alert
    if (test) {
      const testDonation = {
        id: "test-" + Date.now(),
        name: "Test Donor",
        amount: 100,
        message: "This is a test alert from the system! 🎉",
        is_hyperemote: false,
        voice_message_url: null,
        created_at: new Date().toISOString(),
        streamer_id: "test-streamer-id"
      };
      
      const success = await broadcastAlert(streamer_slug || 'ankit', testDonation);
      
      return new Response(
        JSON.stringify({
          success,
          message: success ? "Test alert broadcast successful" : "Test alert broadcast failed",
          activeConnections: activeConnections.size,
          connectionKeys: Array.from(activeConnections.keys()),
          testData: testDonation
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!streamer_slug || !donation) {
      throw new Error("Missing required parameters");
    }

    console.log('📢 Alert broadcast request:', { 
      streamer_slug, 
      donationId: donation.id,
      donationName: donation.name,
      amount: donation.amount,
      activeConnections: activeConnections.size,
      connectionKeys: Array.from(activeConnections.keys())
    });
    
    const success = await broadcastAlert(streamer_slug, donation);

    return new Response(
      JSON.stringify({
        success,
        message: success ? "Alert broadcast successful" : "Alert broadcast failed",
        activeConnections: activeConnections.size,
        connectionKeys: Array.from(activeConnections.keys())
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error broadcasting alert:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        activeConnections: activeConnections.size
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
  
  console.log('✅ Valid token for streamer:', streamerData.streamer_name, 'Slug:', streamerData.streamer_slug, 'Connection Key:', connectionKey);

  // Upgrade to WebSocket
  const { socket, response } = Deno.upgradeWebSocket(req);

  // Keep-alive interval to prevent Edge Function shutdown
  let keepAliveInterval: number | null = null;

  socket.onopen = () => {
    // Store the connection
    activeConnections.set(connectionKey, socket);
    console.log('🚀 WebSocket connected for:', streamerData.streamer_name, 'Total connections:', activeConnections.size, 'Connection Key:', connectionKey);

    // Start keepalive to prevent Edge Function shutdown
    keepAliveInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        } catch (error) {
          console.error('❌ Keepalive ping failed:', error);
          if (keepAliveInterval) {
            clearInterval(keepAliveInterval);
            keepAliveInterval = null;
          }
        }
      }
    }, 30000); // Send ping every 30 seconds

    // Send connection acknowledgment
    const ackMessage: WebSocketMessage = {
      type: 'connection_ack',
      streamer_slug: streamerData.streamer_slug,
      message: `Connected to ${streamerData.streamer_name} alerts`
    };
    socket.send(JSON.stringify(ackMessage));
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'pong') {
        console.log('🏓 Received pong from client');
      }
    } catch (error) {
      console.log('📨 Received non-JSON message from client:', event.data);
    }
  };

  socket.onclose = (event) => {
    console.log('🔌 WebSocket disconnected for:', streamerData.streamer_name, 'Code:', event.code, 'Reason:', event.reason, 'Total connections:', activeConnections.size - 1);
    activeConnections.delete(connectionKey);
    
    // Clear keepalive
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  };

  socket.onerror = (err) => {
    console.error('❌ WebSocket error for:', streamerData.streamer_name, err);
    activeConnections.delete(connectionKey);
    
    // Clear keepalive
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  };

  return response;
}

// Function to broadcast alerts to active connections
async function broadcastAlert(streamerSlug: string, donation: any) {
  console.log('🔔 Broadcasting alert for:', streamerSlug, 'Donor:', donation.name, 'Donation Streamer ID:', donation.streamer_id);
  console.log('🔍 Active connections:', Array.from(activeConnections.keys()));
  
  const connectionKey = `${streamerSlug}-${donation.streamer_id}`;
  console.log('🔑 Looking for connection key:', connectionKey);
  
  const connection = activeConnections.get(connectionKey);
  
  if (!connection) {
    console.log('📡 No active WebSocket connection for key:', connectionKey);
    console.log('📋 Available connection keys:', Array.from(activeConnections.keys()));
    
    // Try to find connection by streamer slug only (fallback)
    let fallbackConnection = null;
    for (const [key, conn] of activeConnections.entries()) {
      if (key.startsWith(streamerSlug + '-')) {
        console.log('🔄 Found fallback connection:', key);
        fallbackConnection = conn;
        break;
      }
    }
    
    if (!fallbackConnection) {
      console.log('❌ No fallback connection found for streamer:', streamerSlug);
      return false;
    }
    
    connection = fallbackConnection;
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
    // Check if connection is still open
    if (connection.readyState !== WebSocket.OPEN) {
      console.log('⚠️ Connection not open, state:', connection.readyState);
      // Clean up dead connections
      for (const [key, conn] of activeConnections.entries()) {
        if (conn.readyState !== WebSocket.OPEN) {
          activeConnections.delete(key);
          console.log('🧹 Cleaned up dead connection:', key);
        }
      }
      return false;
    }

    connection.send(JSON.stringify(alertMessage));
    console.log('📤 Alert broadcast successfully to:', streamerSlug, 'Donor:', donation.name);
    return true;
  } catch (error) {
    console.error('❌ Failed to broadcast alert to:', streamerSlug, error);
    // Remove dead connection
    const keyToDelete = Array.from(activeConnections.entries())
      .find(([key, conn]) => conn === connection)?.[0];
    if (keyToDelete) {
      activeConnections.delete(keyToDelete);
      console.log('🧹 Removed dead connection:', keyToDelete);
    }
    return false;
  }
}