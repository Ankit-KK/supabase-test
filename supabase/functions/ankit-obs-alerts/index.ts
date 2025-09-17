import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseServiceRole = createClient(
  'https://vsevsjvtrshgeiudrnth.supabase.co',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
)

// Store active WebSocket connections (now with database backup)
const activeConnections = new Map<string, WebSocket>()

interface DonationAlert {
  id: string
  name: string
  amount: number
  message: string
  is_hyperemote: boolean
  voice_message_url?: string
  created_at: string
}

interface WebSocketMessage {
  type: 'donation_alert' | 'test_alert' | 'connection_ack' | 'ping' | 'pong' | 'error'
  donation?: DonationAlert
  message?: string
  timestamp?: number
}

async function validateObsToken(token: string) {
  console.log('🔍 Validating OBS token for Ankit')
  
  const { data, error } = await supabaseServiceRole
    .rpc('validate_obs_token_secure', { token_to_check: token })
  
  if (error) {
    console.error('❌ Token validation error:', error)
    return null
  }
  
  // Only allow Ankit tokens
  if (data && data.length > 0 && data[0].streamer_slug === 'ankit') {
    console.log('✅ Valid Ankit token')
    return data[0]
  }
  
  console.log('❌ Invalid token or not Ankit streamer')
  return null
}

function generateConnectionKey(): string {
  return `ankit-${crypto.randomUUID()}`
}

async function registerConnection(connectionKey: string, token: string) {
  try {
    const { error } = await supabaseServiceRole
      .from('active_websocket_connections')
      .insert({
        connection_key: connectionKey,
        streamer_slug: 'ankit',
        token_hash: token.substring(0, 8) + '...' // Store partial token for debugging
      })
    
    if (error) {
      console.error('❌ Failed to register connection:', error)
    } else {
      console.log('✅ Connection registered in database:', connectionKey)
    }
  } catch (error) {
    console.error('❌ Error registering connection:', error)
  }
}

async function unregisterConnection(connectionKey: string) {
  try {
    const { error } = await supabaseServiceRole
      .from('active_websocket_connections')
      .delete()
      .eq('connection_key', connectionKey)
    
    if (error) {
      console.error('❌ Failed to unregister connection:', error)
    } else {
      console.log('✅ Connection unregistered from database:', connectionKey)
    }
  } catch (error) {
    console.error('❌ Error unregistering connection:', error)
  }
}

async function cleanupExpiredConnections() {
  try {
    const { error } = await supabaseServiceRole
      .from('active_websocket_connections')
      .delete()
      .lt('expires_at', new Date().toISOString())
    
    if (error) {
      console.error('❌ Failed to cleanup expired connections:', error)
    }
  } catch (error) {
    console.error('❌ Error cleaning up connections:', error)
  }
}

async function getActiveConnectionsCount(): Promise<number> {
  try {
    const { count, error } = await supabaseServiceRole
      .from('active_websocket_connections')
      .select('*', { count: 'exact', head: true })
      .eq('streamer_slug', 'ankit')
      .gt('expires_at', new Date().toISOString())
    
    if (error) {
      console.error('❌ Failed to get active connections count:', error)
      return activeConnections.size // Fallback to in-memory count
    }
    
    return count || 0
  } catch (error) {
    console.error('❌ Error getting active connections count:', error)
    return activeConnections.size // Fallback to in-memory count
  }
}

function setupPingPong(socket: WebSocket, connectionKey: string) {
  const pingInterval = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'ping',
        timestamp: Date.now()
      }))
    } else {
      clearInterval(pingInterval)
    }
  }, 30000) // 30 seconds

  return pingInterval
}

async function handleWebSocketConnection(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  
  if (!token) {
    return new Response('Missing OBS token', { status: 400 })
  }
  
  // Validate token
  const streamerInfo = await validateObsToken(token)
  if (!streamerInfo) {
    return new Response('Invalid OBS token', { status: 401 })
  }
  
  const { socket, response } = Deno.upgradeWebSocket(request)
  const connectionKey = generateConnectionKey()
  
  console.log(`🚀 New Ankit WebSocket connection: ${connectionKey}`)
  
  socket.onopen = async () => {
    activeConnections.set(connectionKey, socket)
    await registerConnection(connectionKey, token)
    
    const dbCount = await getActiveConnectionsCount()
    console.log(`✅ Ankit WebSocket connected: ${connectionKey}. Memory: ${activeConnections.size}, DB: ${dbCount}`)
    
    // Send connection acknowledgment
    socket.send(JSON.stringify({
      type: 'connection_ack',
      message: 'Connected to Ankit OBS Alerts',
      streamer_slug: 'ankit'
    }))
    
    // Setup ping/pong with database heartbeat
    setupPingPong(socket, connectionKey)
  }
  
  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data)
      console.log('📨 Received message:', message)
      
      if (message.type === 'pong') {
        console.log('🏓 Pong received from', connectionKey)
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error)
    }
  }
  
  socket.onclose = async (event) => {
    activeConnections.delete(connectionKey)
    await unregisterConnection(connectionKey)
    
    const dbCount = await getActiveConnectionsCount()
    console.log(`🔌 Ankit WebSocket closed: ${connectionKey}, Code: ${event.code}, Reason: ${event.reason}. Memory: ${activeConnections.size}, DB: ${dbCount}`)
  }
  
  socket.onerror = async (error) => {
    console.error(`❌ Ankit WebSocket error for ${connectionKey}:`, error)
    activeConnections.delete(connectionKey)
    await unregisterConnection(connectionKey)
  }
  
  return response
}

async function handleBroadcast(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    console.log('📡 Ankit broadcast request received:', body)
    
    const { donation_id } = body
    
    if (!donation_id) {
      console.error('❌ Missing donation_id in broadcast request')
      throw new Error('Missing donation_id')
    }
    
    // Clean up expired connections first
    await cleanupExpiredConnections()
    
    // Fetch complete donation data from Ankit's table
    const { data: donation, error } = await supabaseServiceRole
      .from('ankit_donations')
      .select('*')
      .eq('id', donation_id)
      .single()
    
    if (error || !donation) {
      console.error('❌ Failed to fetch Ankit donation:', error)
      throw new Error('Donation not found')
    }
    
    console.log('📊 Ankit donation found:', {
      id: donation.id,
      name: donation.name,
      amount: donation.amount,
      status: donation.moderation_status
    })
    
    // Get counts from both memory and database
    const dbConnectionCount = await getActiveConnectionsCount()
    const memoryConnectionCount = activeConnections.size
    
    console.log('📊 Broadcasting to connections - Memory:', memoryConnectionCount, 'DB:', dbConnectionCount)
    
    if (memoryConnectionCount === 0 && dbConnectionCount === 0) {
      console.log('⚠️ No active Ankit connections to broadcast to (checked both memory and database)')
      return new Response(JSON.stringify({
        success: true,
        message: 'No active connections',
        connections: 0,
        database_connections: dbConnectionCount,
        memory_connections: memoryConnectionCount
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const alertMessage: WebSocketMessage = {
      type: 'donation_alert',
      donation: {
        id: donation.id,
        name: donation.name,
        amount: donation.amount,
        message: donation.message || '',
        is_hyperemote: donation.is_hyperemote || false,
        voice_message_url: donation.voice_message_url,
        created_at: donation.created_at
      },
      timestamp: Date.now()
    }
    
    let successCount = 0
    let failureCount = 0
    
    for (const [connectionKey, socket] of activeConnections.entries()) {
      try {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(alertMessage))
          successCount++
          console.log(`✅ Ankit alert sent to ${connectionKey}`)
        } else {
          console.log(`⚠️ Removing stale Ankit connection: ${connectionKey}`)
          activeConnections.delete(connectionKey)
          await unregisterConnection(connectionKey)
          failureCount++
        }
      } catch (error) {
        console.error(`❌ Error sending to ${connectionKey}:`, error)
        activeConnections.delete(connectionKey)
        await unregisterConnection(connectionKey)
        failureCount++
      }
    }
    
    console.log(`📊 Ankit broadcast complete: ${successCount} success, ${failureCount} failures`)
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Alert broadcasted to Ankit connections',
      connections: successCount,
      database_connections: dbConnectionCount,
      memory_connections: memoryConnectionCount,
      donation: {
        id: donation.id,
        name: donation.name,
        amount: donation.amount
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('❌ Ankit broadcast error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  console.log(`📡 Ankit OBS Alerts: ${req.method} ${req.url}`)
  
  // Handle WebSocket upgrade
  if (req.headers.get('upgrade')?.toLowerCase() === 'websocket') {
    return await handleWebSocketConnection(req)
  }
  
  // Handle broadcast requests
  if (req.method === 'POST') {
    return await handleBroadcast(req)
  }
  
  return new Response('Ankit OBS Alerts WebSocket Server', {
    headers: corsHeaders
  })
})