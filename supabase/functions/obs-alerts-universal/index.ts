import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebSocketMessage {
  type: 'donation_alert' | 'ping' | 'pong' | 'connection_ack' | 'test_alert';
  donation?: any;
  message?: string;
  timestamp?: number;
  streamer_slug?: string;
}

// Global connections map: token -> WebSocket
const activeConnections = new Map<string, WebSocket>();

serve(async (req) => {
  const url = new URL(req.url);
  
  // Handle WebSocket upgrade for OBS connections
  if (req.headers.get("upgrade") === "websocket") {
    return handleWebSocketConnection(req, url);
  }

  // Handle HTTP requests for broadcasting alerts
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return handleBroadcastRequest(req);
});

async function handleWebSocketConnection(req: Request, url: URL) {
  const token = url.searchParams.get('token');
  const streamerSlug = url.searchParams.get('streamer') || 'unknown';
  
  if (!token) {
    return new Response('Token required', { status: 400 });
  }

  console.log(`🔌 WebSocket connection attempt for ${streamerSlug} with token: ${token}`);

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Validate token using the secure function
  const { data: validation, error } = await supabase.rpc('validate_obs_token_secure', {
    token_to_check: token
  });

  if (error || !validation || validation.length === 0 || !validation[0].is_valid) {
    console.log(`❌ Invalid token for ${streamerSlug}: ${token}`);
    return new Response('Invalid token', { status: 401 });
  }

  const streamerInfo = validation[0];
  console.log(`✅ Valid token for streamer: ${streamerInfo.streamer_name} (${streamerInfo.streamer_slug})`);

  // Upgrade to WebSocket
  const { socket, response } = Deno.upgradeWebSocket(req);
  
  socket.onopen = () => {
    console.log(`🟢 WebSocket connected for ${streamerInfo.streamer_name}`);
    activeConnections.set(token, socket);
    
    // Send connection acknowledgment
    const ackMessage: WebSocketMessage = {
      type: 'connection_ack',
      message: `Connected to ${streamerInfo.streamer_name} alerts`,
      timestamp: Date.now(),
      streamer_slug: streamerInfo.streamer_slug
    };
    
    try {
      socket.send(JSON.stringify(ackMessage));
    } catch (error) {
      console.error('Error sending ack message:', error);
    }
  };

  socket.onmessage = (event) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log(`📨 Message from ${streamerInfo.streamer_name}:`, message.type);
      
      if (message.type === 'pong') {
        console.log(`🏓 Pong received from ${streamerInfo.streamer_name}`);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  socket.onclose = () => {
    console.log(`🔴 WebSocket disconnected for ${streamerInfo.streamer_name}`);
    activeConnections.delete(token);
  };

  socket.onerror = (error) => {
    console.error(`❌ WebSocket error for ${streamerInfo.streamer_name}:`, error);
    activeConnections.delete(token);
  };

  // Setup ping interval to keep connection alive
  const pingInterval = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      try {
        const pingMessage: WebSocketMessage = {
          type: 'ping',
          timestamp: Date.now()
        };
        socket.send(JSON.stringify(pingMessage));
        console.log(`🏓 Ping sent to ${streamerInfo.streamer_name}`);
      } catch (error) {
        console.error('Error sending ping:', error);
        clearInterval(pingInterval);
        activeConnections.delete(token);
      }
    } else {
      clearInterval(pingInterval);
      activeConnections.delete(token);
    }
  }, 30000); // Ping every 30 seconds

  return response;
}

async function handleBroadcastRequest(req: Request) {
  try {
    const { streamer_slug, donation, test } = await req.json();
    
    if (!streamer_slug) {
      throw new Error('streamer_slug is required');
    }

    console.log(`📡 Broadcasting alert for ${streamer_slug}${test ? ' (TEST)' : ''}`);

    let alertData = donation;
    
    // Create test donation if this is a test
    if (test) {
      alertData = {
        id: 'test-' + Date.now(),
        name: 'Test Donor',
        amount: 100,
        message: `Test alert for ${streamer_slug}! 🎉`,
        is_hyperemote: false,
        created_at: new Date().toISOString(),
        voice_message_url: null
      };
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active OBS tokens for this streamer
    const { data: streamerTokens, error } = await supabase
      .from('obs_tokens')
      .select('token')
      .eq('streamer_id', (
        await supabase
          .from('streamers')
          .select('id')
          .eq('streamer_slug', streamer_slug)
          .single()
      ).data?.id)
      .eq('is_active', true);

    if (error || !streamerTokens) {
      console.log(`❌ No active tokens found for ${streamer_slug}`);
      return new Response(JSON.stringify({
        success: false,
        message: 'No active OBS tokens found',
        activeConnections: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let sentCount = 0;
    const tokens = streamerTokens.map(t => t.token);

    console.log(`🔍 Found ${tokens.length} active tokens for ${streamer_slug}`);
    console.log(`🔗 Active WebSocket connections: ${activeConnections.size}`);

    // Send to all active connections for this streamer
    for (const [connectionToken, socket] of activeConnections.entries()) {
      if (tokens.includes(connectionToken) && socket.readyState === WebSocket.OPEN) {
        try {
          const alertMessage: WebSocketMessage = {
            type: test ? 'test_alert' : 'donation_alert',
            donation: alertData,
            timestamp: Date.now(),
            streamer_slug: streamer_slug
          };
          
          socket.send(JSON.stringify(alertMessage));
          sentCount++;
          console.log(`✅ Alert sent to connection for ${streamer_slug}`);
        } catch (error) {
          console.error(`❌ Failed to send to connection:`, error);
          activeConnections.delete(connectionToken);
        }
      }
    }

    return new Response(JSON.stringify({
      success: sentCount > 0,
      message: sentCount > 0 ? `Alert sent to ${sentCount} connection(s)` : 'No active connections found',
      activeConnections: sentCount,
      totalConnections: activeConnections.size,
      streamer_tokens: tokens.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in broadcast request:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      activeConnections: activeConnections.size
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
