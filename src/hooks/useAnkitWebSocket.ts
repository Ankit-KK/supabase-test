import { useState, useEffect, useRef, useCallback } from 'react'

interface Donation {
  id: string
  name: string
  amount: number
  message: string
  voice_message_url?: string
  is_hyperemote: boolean
  created_at: string
}

interface WebSocketMessage {
  type: 'donation_alert' | 'test_alert' | 'connection_ack' | 'ping' | 'pong' | 'error'
  donation?: Donation
  message?: string
  timestamp?: number
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export const useAnkitWebSocket = (token: string) => {
  const [currentAlert, setCurrentAlert] = useState<Donation | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [connectionCount, setConnectionCount] = useState(0)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 10
  const isConnecting = useRef(false)

  const clearAlert = useCallback(() => {
    console.log('🧹 Clearing current alert')
    setIsVisible(false)
    
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current)
      alertTimeoutRef.current = null
    }
    
    setTimeout(() => {
      setCurrentAlert(null)
    }, 1000)
  }, [])

  const showAlert = useCallback((donation: Donation, reason: string) => {
    console.log('🎬 Showing Ankit alert:', { donation, reason })
    
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current)
    }
    
    setCurrentAlert(donation)
    setIsVisible(true)
    
    // Auto-hide alert after duration
    const duration = donation.voice_message_url ? 15000 : 
                     donation.is_hyperemote ? 8000 : 6000
    
    alertTimeoutRef.current = setTimeout(() => {
      clearAlert()
    }, duration)
  }, [clearAlert])

  const connectWebSocket = useCallback(() => {
    if (!token) {
      console.log('❌ No token provided for Ankit WebSocket')
      return
    }

    if (isConnecting.current) {
      console.log('🔄 Already connecting to Ankit WebSocket')
      return
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING || 
        wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔄 Ankit WebSocket already connecting/connected')
      return
    }

    console.log('🔌 Connecting to Ankit WebSocket...')
    isConnecting.current = true
    setConnectionStatus('connecting')

    const wsUrl = `wss://vsevsjvtrshgeiudrnth.supabase.co/functions/v1/ankit-obs-alerts?token=${encodeURIComponent(token)}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    // Connection timeout
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.log('⏰ Ankit WebSocket connection timeout')
        ws.close()
      }
    }, 10000)

    ws.onopen = () => {
      console.log('✅ Ankit WebSocket connected')
      clearTimeout(connectionTimeout)
      isConnecting.current = false
      setConnectionStatus('connected')
      reconnectAttempts.current = 0
      setConnectionCount(1) // Ankit specific connection
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        console.log('📨 Ankit WebSocket message:', message)
        
        if (message.type === 'donation_alert' || message.type === 'test_alert') {
          if (message.donation) {
            showAlert(message.donation, `Ankit ${message.type}`)
          }
        } else if (message.type === 'ping') {
          // Respond to ping with pong
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
          }
        } else if (message.type === 'connection_ack') {
          console.log('🤝 Ankit connection acknowledged:', message.message)
        }
      } catch (error) {
        console.error('❌ Error parsing Ankit WebSocket message:', error)
      }
    }

    ws.onclose = (event) => {
      console.log('🔌 Ankit WebSocket closed:', event.code, event.reason)
      clearTimeout(connectionTimeout)
      isConnecting.current = false
      setConnectionStatus('disconnected')
      setConnectionCount(0)
      
      // Don't reconnect if it was a clean close or if we're at max attempts
      if (event.code === 1000) {
        console.log('✅ Ankit WebSocket closed cleanly')
        return
      }
      
      // Attempt reconnection with exponential backoff for abnormal closures
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(2000 * Math.pow(1.5, reconnectAttempts.current), 30000)
        console.log(`🔄 Reconnecting to Ankit in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts}) - Code: ${event.code}`)
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++
          connectWebSocket()
        }, delay)
      } else {
        console.error('❌ Max Ankit reconnection attempts reached')
        setConnectionStatus('error')
      }
    }

    ws.onerror = (error) => {
      console.error('❌ Ankit WebSocket error:', error)
      clearTimeout(connectionTimeout)
      isConnecting.current = false
      setConnectionStatus('error')
    }
  }, [token, showAlert])

  const triggerTestAlert = useCallback(() => {
    console.log('🧪 Triggering Ankit test alert')
    const testDonation: Donation = {
      id: `test-ankit-${Date.now()}`,
      name: 'Test Donor',
      amount: 10,
      message: 'This is a test alert for Ankit!',
      is_hyperemote: false,
      created_at: new Date().toISOString()
    }
    
    showAlert(testDonation, 'Manual test')
  }, [showAlert])

  // Connect on mount and when token changes
  useEffect(() => {
    if (token) {
      // Small delay to prevent rapid reconnections
      const connectTimeout = setTimeout(() => {
        connectWebSocket()
      }, 100)
      
      return () => clearTimeout(connectTimeout)
    }
  }, [connectWebSocket, token])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current)
      }
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current)
      }
      if (wsRef.current) {
        isConnecting.current = false
        wsRef.current.close(1000, 'Component unmounting')
      }
    }
  }, [])

  return {
    currentAlert,
    isVisible,
    connectionStatus,
    connectionCount,
    triggerTestAlert,
    clearAlert
  }
}