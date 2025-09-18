import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hybrid approach: in-memory connections + database tracking
const activeConnections = new Map<string, { socket: WebSocket, streamerData: any, lastPing?: number }>();

const supabaseServiceRole = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// WebSocket message types
interface WebSocketMessage {
  type: 'donation_alert' | 'test_alert' | 'connection_ack' | 'error';
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
  console.log('📡 Handling broadcast request to:', url.pathname);
  return handleBroadcastRequest(req);
});


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
        message: 'This is a test alert! 🎉',
        is_hyperemote: false,
        created_at: new Date().toISOString()
      };
      
      console.log('🧪 Broadcasting test alert for streamer:', streamer_slug, testDonation);
      const result = await broadcastAlert(streamer_slug || 'ankit', testDonation);
      
      return new Response(JSON.stringify({
        success: result.success,
        message: result.success ? 'Test alert sent successfully!' : 'No active connections found',
        activeConnections: result.activeConnections,
        totalConnections: result.totalConnections,
        connectionKeys: Array.from(activeConnections.keys())
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!streamer_slug) {
      console.error('❌ Missing required parameter: streamer_slug');
      throw new Error('Missing required parameter: streamer_slug');
    }
    
    // Handle both full donation objects and partial data from approval functions
    let donationData = donation;
    if (!donation || (!donation.message && body.donation_id)) {
      console.log('🔍 Fetching complete donation data from database');
      
      // Determine which table to query based on streamer
      let tableName = 'demostreamer_donations'; // default
      if (streamer_slug === 'ankit') {
        tableName = 'ankit_donations';
      } else if (streamer_slug === 'chia_gaming') {
        tableName = 'chia_gaming_donations';
      }
      
      const { data: fullDonation, error: fetchError } = await supabaseServiceRole
        .from(tableName)
        .select('*')
        .eq('id', body.donation_id)
        .single();
        
      if (fetchError) {
        console.error('❌ Failed to fetch donation data:', fetchError);
        throw new Error('Failed to fetch donation data: ' + fetchError.message);
      }
      
      donationData = fullDonation;
      console.log('✅ Fetched complete donation data:', {
        id: donationData.id,
        name: donationData.name,
        amount: donationData.amount,
        message: donationData.message,
        is_hyperemote: donationData.is_hyperemote
      });
    }
    
    if (!donationData) {
      throw new Error('No donation data available');
    }
    
    console.log('📤 Broadcasting real donation alert...');
    const result = await broadcastAlert(streamer_slug, donationData);
    
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

  // Store connection in database for tracking
  try {
    await supabaseServiceRole
      .from('active_websocket_connections')
      .insert({
        connection_key: connectionKey,
        streamer_id: streamerData.streamer_id,
        streamer_slug: streamerData.streamer_slug,
        streamer_name: streamerData.streamer_name,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
      });
  } catch (dbError) {
    console.log('⚠️ Warning: Could not track connection in database:', dbError);
    // Continue anyway - database tracking is for monitoring only
  }

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
    keepAliveInterval = setInterval(async () => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          // Update database tracking
          await supabaseServiceRole
            .from('active_websocket_connections')
            .update({
              last_ping_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // Extend for another hour
            })
            .eq('connection_key', connectionKey);

          socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        } catch (error) {
          console.error('❌ Keepalive ping failed:', error);
          if (keepAliveInterval) {
            clearInterval(keepAliveInterval);
            keepAliveInterval = null;
          }
        }
      }
    }, 15000); // Send ping every 15 seconds to maintain connection

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

  socket.onclose = async (event) => {
    console.log('🔌 WebSocket disconnected for:', streamerData.streamer_name, 'Code:', event.code, 'Reason:', event.reason, 'Total connections:', activeConnections.size - 1);
    activeConnections.delete(connectionKey);
    
    // Remove from database tracking
    try {
      await supabaseServiceRole
        .from('active_websocket_connections')
        .delete()
        .eq('connection_key', connectionKey);
    } catch (error) {
      console.log('⚠️ Warning: Could not remove connection from database:', error);
    }
    
    // Clear keepalive
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  };

  socket.onerror = async (err) => {
    console.error('❌ WebSocket error for:', streamerData.streamer_name, err);
    activeConnections.delete(connectionKey);
    
    // Remove from database tracking
    try {
      await supabaseServiceRole
        .from('active_websocket_connections')
        .delete()
        .eq('connection_key', connectionKey);
    } catch (error) {
      console.log('⚠️ Warning: Could not remove connection from database:', error);
    }
    
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
  
  // First cleanup expired connections from database
  try {
    await supabaseServiceRole.rpc('cleanup_expired_websocket_connections');
  } catch (error) {
    console.log('⚠️ Warning: Could not cleanup expired connections:', error);
  }
  
  // Find connections for this streamer in memory
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
    
    // Also check database for monitoring
    try {
      const { count } = await supabaseServiceRole
        .from('active_websocket_connections')
        .select('*', { count: 'exact', head: true })
        .eq('streamer_slug', streamerSlug)
        .gte('expires_at', new Date().toISOString());
      console.log(`📊 Database shows ${count || 0} connections for ${streamerSlug}`);
    } catch (error) {
      console.log('⚠️ Warning: Could not check database connections:', error);
    }
    
    return { success: false, activeConnections: 0, totalConnections: activeConnections.size };
  }
  
  const alertMessage = {
    type: 'donation_alert',
    donation: {
      id: donation.id,
      name: donation.name,
      amount: donation.amount,
      message: donation.message,
      is_hyperemote: donation.is_hyperemote || false,
      voice_message_url: donation.voice_message_url || null,
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
