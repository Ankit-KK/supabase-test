import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory store for active WebSocket connections
const activeConnections = new Map<string, { socket: WebSocket, streamerData: any, lastPing?: number }>();

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

  // Check for WebSocket upgrade FIRST
  if (upgradeHeader.toLowerCase() === "websocket") {
    console.log('🔌 Handling WebSocket connection request');
    return handleWebSocketConnection(req);
  }

  // Handle HTTP requests for broadcasting alerts
  if (url.pathname === '/test-alert') {
    console.log('🧪 Handling test alert request');
    return handleTestAlert(req);
  }
  
  // Default to broadcast request
  console.log('📡 Handling broadcast request to:', url.pathname);
  return handleBroadcastRequest(req);
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

// Handle HTTP requests for broadcasting alerts
async function handleBroadcastRequest(req: Request) {
  try {
    console.log('📡 Processing broadcast request...');
    const body = await req.json();
    const { streamer_slug, donation, test } = body;
    
    console.log('📡 Broadcast request received:', { 
      streamer_slug, 
      test, 
      donation_id: donation?.id,
      donation_amount: donation?.amount,
      donation_name: donation?.name,
      activeConnections: activeConnections.size,
      connectionKeys: Array.from(activeConnections.keys())
    });
    
    if (test) {
      // Handle test alert
      const testDonation = {
        id: 'test-' + Date.now(),
        name: 'Test Donor',
        amount: 100,
        message: 'This is a test alert!',
        is_hyperemote: false,
        created_at: new Date().toISOString()
      };
      
      console.log('🧪 Broadcasting test alert:', testDonation);
      const result = await broadcastAlert(streamer_slug, testDonation);
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Test alert broadcasted',
        ...result
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!streamer_slug || !donation) {
      console.error('❌ Missing required parameters:', { streamer_slug, donation: !!donation });
      throw new Error('Missing required parameters: streamer_slug and donation');
    }
    
    console.log('📤 Broadcasting real donation alert...');
    const result = await broadcastAlert(streamer_slug, donation);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Alert broadcasted successfully',
      ...result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Broadcast request error:', error);
    console.error('❌ Full error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: error.stack
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
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
  const connectionKey = `${streamerData.streamer_slug}-${crypto.randomUUID()}`;
  
  console.log('✅ Valid token for streamer:', streamerData.streamer_name, 'Slug:', streamerData.streamer_slug, 'Connection Key:', connectionKey);

  // Upgrade to WebSocket
  const { socket, response } = Deno.upgradeWebSocket(req);

  // Keep-alive interval to prevent Edge Function shutdown
  let keepAliveInterval: number | null = null;

  socket.onopen = () => {
    // Store the connection with metadata
    activeConnections.set(connectionKey, { 
      socket, 
      streamerData, 
      lastPing: Date.now() 
    });
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

// Broadcast alert to connected clients
async function broadcastAlert(streamerSlug: string, donation: any) {
  console.log(`📡 Broadcasting alert for streamer: ${streamerSlug}`, donation);
  console.log(`🔍 Current active connections:`, Array.from(activeConnections.keys()));
  
  // Find connections for this streamer
  const connections = Array.from(activeConnections.entries()).filter(
    ([key, conn]) => {
      const isMatch = key.startsWith(`${streamerSlug}-`) && conn.socket.readyState === WebSocket.OPEN;
      console.log(`🔍 Connection ${key}: streamer match=${key.startsWith(`${streamerSlug}-`)}, readyState=${conn.socket.readyState}, isOpen=${conn.socket.readyState === WebSocket.OPEN}`);
      return isMatch;
    }
  );
  
  console.log(`🔍 Found ${connections.length} active connections for ${streamerSlug}`);
  
  if (connections.length === 0) {
    console.log(`❌ No active WebSocket connections found for streamer: ${streamerSlug}`);
    console.log(`📊 Total active connections: ${activeConnections.size}`);
    return { success: false, activeConnections: 0, totalConnections: activeConnections.size };
  }
  
  const alertMessage = {
    type: 'donation_approved',
    donation: {
      id: donation.id,
      name: donation.name,
      amount: donation.amount,
      message: donation.message,
      is_hyperemote: donation.is_hyperemote,
      created_at: donation.created_at
    },
    timestamp: Date.now()
  };
  
  console.log(`📤 Sending alert message:`, alertMessage);
  
  let successCount = 0;
  
  for (const [key, conn] of connections) {
    try {
      if (conn.socket.readyState === WebSocket.OPEN) {
        conn.socket.send(JSON.stringify(alertMessage));
        console.log(`✅ Alert sent to connection: ${key}`);
        successCount++;
      } else {
        console.log(`❌ Connection ${key} is not open (state: ${conn.socket.readyState}), removing`);
        activeConnections.delete(key);
      }
    } catch (error) {
      console.error(`❌ Failed to send alert to connection ${key}:`, error);
      activeConnections.delete(key);
    }
  }
  
  console.log(`📊 Broadcast complete: ${successCount}/${connections.length} successful`);
  return { success: successCount > 0, activeConnections: successCount, totalConnections: activeConnections.size };
}