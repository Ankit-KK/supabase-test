import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  voice_message_url: string;
  is_hyperemote: boolean;
  created_at: string;
}

const TechGamerAlerts = () => {
  const { token } = useParams<{ token: string }>();
  const [currentAlert, setCurrentAlert] = useState<Donation | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!token) {
      console.error('No OBS token provided');
      return;
    }

    console.log('🔌 Connecting to TechGamer OBS alerts with token:', token);

    // Connect to the universal WebSocket endpoint
    const wsUrl = `wss://vsevsjvtrshgeiudrnth.functions.supabase.co/obs-alerts-universal?token=${token}&streamer=techgamer`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ Connected to TechGamer OBS alerts');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Alert message received:', data);

        if (data.type === 'donation_alert' || data.type === 'test_alert') {
          showAlert(data.donation);
        } else if (data.type === 'ping') {
          // Send pong response
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        } else if (data.type === 'connection_ack') {
          console.log('✅ Connection acknowledged:', data.message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('🔴 WebSocket connection closed, attempting to reconnect...');
      setTimeout(() => {
        if (!websocket || websocket.readyState === WebSocket.CLOSED) {
          // Reconnect after 5 seconds
          window.location.reload();
        }
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    setWebsocket(ws);

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [token]);

  const showAlert = (donation: Donation) => {
    console.log('🎬 Showing alert for:', donation);
    setCurrentAlert(donation);
    setIsVisible(true);

    // Play notification sound
    const audio = new Audio('/notification.mp3');
    audio.play().catch(console.error);

    // Hide alert after duration based on amount
    const baseDuration = 5000; // 5 seconds
    const amountMultiplier = Math.min(donation.amount / 10, 10); // Max 10x multiplier
    const totalDuration = baseDuration + (amountMultiplier * 1000);

    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentAlert(null);
      }, 1000); // Wait for fade out animation
    }, totalDuration);

    // Play voice message if available
    if (donation.voice_message_url) {
      setTimeout(() => {
        const voiceAudio = new Audio(donation.voice_message_url);
        voiceAudio.play().catch(console.error);
      }, 1000);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-transparent pointer-events-none">
      {/* Connection Status */}
      <div className="absolute top-4 right-4 z-50">
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          websocket?.readyState === WebSocket.OPEN
            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
            : 'bg-red-500/20 text-red-300 border border-red-500/30'
        }`}>
          {websocket?.readyState === WebSocket.OPEN ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>

      {/* Alert Display */}
      {currentAlert && (
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <div className={`max-w-2xl mx-4 p-8 rounded-2xl border-2 shadow-2xl backdrop-blur-sm transform transition-all duration-1000 ${
            currentAlert.is_hyperemote
              ? 'bg-gradient-to-br from-blue-900/90 to-purple-900/90 border-blue-400 animate-pulse'
              : 'bg-gradient-to-br from-blue-800/90 to-blue-900/90 border-blue-500'
          }`}>
            
            <div className="text-center space-y-4">
              {/* Header */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="text-4xl">🎮</div>
                <h1 className="text-3xl font-bold text-white">TechGamer</h1>
                {currentAlert.is_hyperemote && (
                  <div className="text-4xl animate-bounce">⚡</div>
                )}
              </div>

              {/* Donation Amount */}
              <div className={`text-6xl font-bold mb-4 ${
                currentAlert.is_hyperemote ? 'text-yellow-300' : 'text-blue-300'
              }`}>
                {formatAmount(currentAlert.amount)}
              </div>

              {/* Donor Name */}
              <div className="text-2xl font-semibold text-white mb-4">
                Thank you, <span className="text-blue-300">{currentAlert.name}</span>!
              </div>

              {/* Message */}
              {currentAlert.message && (
                <div className="bg-black/30 rounded-lg p-4 border border-blue-500/30">
                  <p className="text-lg text-blue-100 leading-relaxed">
                    "{currentAlert.message}"
                  </p>
                </div>
              )}

              {/* Voice Message Indicator */}
              {currentAlert.voice_message_url && (
                <div className="flex items-center justify-center gap-2 text-blue-300">
                  <div className="animate-pulse">🎤</div>
                  <span className="text-sm">Playing voice message...</span>
                </div>
              )}

              {/* Hyperemote Effects */}
              {currentAlert.is_hyperemote && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse rounded-2xl"></div>
                  <div className="absolute -top-2 -left-2 -right-2 -bottom-2 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-2xl animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechGamerAlerts;