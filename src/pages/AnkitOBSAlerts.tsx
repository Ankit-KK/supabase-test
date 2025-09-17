import React from 'react'
import { useParams } from 'react-router-dom'
import { AlertDisplay } from '@/components/AlertDisplay'
import { useAnkitWebSocket } from '@/hooks/useAnkitWebSocket'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { Button } from '@/components/ui/button'

const AnkitOBSAlerts = () => {
  const { token } = useParams<{ token: string }>()
  
  const {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
    clearAlert,
    connectionCount
  } = useAnkitWebSocket(token || '')

  if (!token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-xl">
          Missing OBS token in URL
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Connection Status Indicator */}
      <div className="absolute top-4 right-4 z-50">
        <div className={`
          px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2
          ${connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            connectionStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
            connectionStatus === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
            'bg-gray-500/20 text-gray-400 border border-gray-500/30'}
        `}>
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-400' :
            connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
            connectionStatus === 'error' ? 'bg-red-400' :
            'bg-gray-400'
          }`} />
          {connectionStatus === 'connected' ? 'Connected' :
           connectionStatus === 'connecting' ? 'Connecting...' :
           connectionStatus === 'error' ? 'Disconnected' :
           'Unknown'}
          {connectionCount > 0 && ` (${connectionCount})`}
        </div>
      </div>

      {/* Test Controls - Only visible on hover */}
      <div className="absolute top-4 left-4 z-50 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="flex gap-2">
          <Button
            onClick={triggerTestAlert}
            variant="outline"
            size="sm"
            className="bg-black/50 border-white/20 text-white hover:bg-white/10"
          >
            Test Alert
          </Button>
          <Button
            onClick={clearAlert}
            variant="outline"
            size="sm"
            className="bg-black/50 border-white/20 text-white hover:bg-white/10"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Debug Info - Only visible on hover */}
      <div className="absolute bottom-4 left-4 z-50 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="bg-black/80 text-white text-xs p-3 rounded border border-white/20 max-w-md">
          <div>Status: <span className={connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}>{connectionStatus}</span></div>
          <div>Token: {token.substring(0, 16)}...</div>
          <div>Alert Active: {isVisible ? 'Yes' : 'No'}</div>
          {currentAlert && (
            <div className="mt-2 pt-2 border-t border-white/20">
              <div>Current: {currentAlert.name} - ₹{currentAlert.amount}</div>
              <div>Message: {currentAlert.message}</div>
              <div>Hyperemote: {currentAlert.is_hyperemote ? 'Yes' : 'No'}</div>
            </div>
          )}
        </div>
      </div>

      {/* Main Alert Display */}
      <div className="flex items-center justify-center min-h-screen">
        <AlertDisplay
          donation={currentAlert}
          isVisible={isVisible}
          streamerBrandColor="#3b82f6"
          streamerName="Ankit"
        />
      </div>

      {/* Connection Error Overlay */}
      {connectionStatus === 'error' && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-40">
          <div className="text-center text-white">
            <div className="text-red-500 text-2xl mb-4">⚠️ Connection Error</div>
            <div className="text-lg">Failed to connect to Ankit alerts</div>
            <div className="text-sm text-gray-400 mt-2">Check your OBS token and refresh the page</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnkitOBSAlerts