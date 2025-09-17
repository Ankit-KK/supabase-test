import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useWebSocketAlerts } from '@/hooks/useWebSocketAlerts';
import { AlertDisplay } from '@/components/AlertDisplay';
import { Button } from '@/components/ui/button';

interface StreamerInfo {
  id: string;
  streamer_slug: string;
  streamer_name: string;
  brand_color: string;
  brand_logo_url?: string;
}

const DemoStreamerAlerts = () => {
  const { token } = useParams<{ token: string }>();
  const [streamerInfo, setStreamerInfo] = useState<StreamerInfo | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Validate token and get streamer info
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        console.log('❌ No token provided');
        setIsValidToken(false);
        return;
      }

      console.log('🔍 Validating OBS token...');

      try {
        const { data, error } = await supabase.rpc('validate_obs_token_secure', {
          token_to_check: token
        });

        if (error) {
          console.error('❌ Token validation error:', error);
          setIsValidToken(false);
          return;
        }

        if (data && data.length > 0 && data[0].is_valid) {
          console.log('✅ Token validation successful:', data[0].streamer_name);
          setStreamerInfo({
            id: data[0].streamer_id,
            streamer_slug: data[0].streamer_slug,
            streamer_name: data[0].streamer_name,
            brand_color: data[0].brand_color,
            brand_logo_url: data[0].brand_logo_url
          });
          setIsValidToken(true);
        } else {
          console.log('❌ Invalid token');
          setIsValidToken(false);
        }
      } catch (error) {
        console.error('❌ Token validation failed:', error);
        setIsValidToken(false);
      }
    };

    validateToken();
  }, [token]);

  // Use WebSocket alerts system
  const {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert
  } = useWebSocketAlerts({
    token: token || '',
    enabled: isValidToken === true
  });

  // Loading state
  if (isValidToken === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-lg">Validating OBS token...</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (!isValidToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-900 text-white">
        <div className="text-center">
          <p className="text-2xl font-bold mb-4">❌ Invalid OBS Token</p>
          <p className="text-lg">Please check your OBS browser source URL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Debug Info */}
      {showDebug && (
        <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-40">
          <div>Status: {connectionStatus}</div>
          <div>Streamer: {streamerInfo?.streamer_name}</div>
          <div>Current Alert: {currentAlert?.name || 'None'}</div>
          <div>Visible: {isVisible ? 'Yes' : 'No'}</div>
          <Button 
            onClick={triggerTestAlert}
            className="mt-2 text-xs"
            size="sm"
          >
            Test Alert
          </Button>
        </div>
      )}

      {/* Debug Toggle */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-1 rounded text-xs z-40"
      >
        Debug
      </button>

      {/* Connection Status Indicator */}
      <div className="fixed top-4 left-4 z-40">
        <div className={`w-3 h-3 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-500' : 
          connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
        }`}></div>
      </div>

      {/* Alert Display */}
      <AlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        streamerBrandColor={streamerInfo?.brand_color}
        streamerName={streamerInfo?.streamer_name}
      />
    </div>
  );
};

export default DemoStreamerAlerts;