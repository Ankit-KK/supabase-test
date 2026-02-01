import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UnifiedAlertDisplay } from './UnifiedAlertDisplay';
import { usePusherConfig } from '@/hooks/usePusherConfig';
import { useWebAudioPlayer } from '@/hooks/useWebAudioPlayer';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { supabase } from '@/integrations/supabase/client';
import { ResizableWidget } from './ResizableWidget';
import { LeaderboardWidget } from './LeaderboardWidget';
import { getStreamerConfig } from '@/config/streamers';
import Pusher from 'pusher-js';

interface AlertDonation {
  id: string;
  name: string;
  amount: number;
  currency?: string;
  message?: string;
  // Audio is resolved locally from audio_type + id (NO URLs in payloads)
  has_audio: boolean;
  audio_type?: 'tts' | 'voice' | 'hypersound';
  is_hyperemote?: boolean;
  media_url?: string;
  media_type?: string;
}

interface Props {
  streamerSlug: string;
  storagePrefix?: string;
}

// R2 public bucket base URL
const R2_BASE_URL = 'https://pub-3968c5ed4c4c448d85e9dc68e6552634.r2.dev';

/**
 * Browser Source Alert with WebAudio
 * 
 * Core Principle: "Assume OBS Media Source re-downloads media on every play. 
 * Any architecture that relies on its caching is invalid."
 * 
 * This component:
 * - Fetches audio ONCE per donation via WebAudio API
 * - Stores in memory (not HTTP cache)
 * - Syncs visual alert with audio playback
 * - Cleans up buffer after playback
 */
export const BrowserSourceAlertWithAudio: React.FC<Props> = ({
  streamerSlug,
  storagePrefix,
}) => {
  const config = getStreamerConfig(streamerSlug);
  
  if (!config) {
    return (
      <div className="fixed inset-0 bg-transparent flex items-center justify-center">
        <div className="text-red-500">Invalid streamer: {streamerSlug}</div>
      </div>
    );
  }

  const [streamerId, setStreamerId] = useState<string | null>(null);
  const [currentAlert, setCurrentAlert] = useState<AlertDonation | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [alertBoxScale, setAlertBoxScale] = useState(1.0);
  const [brandColor, setBrandColor] = useState(config.brandColor);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const { config: pusherConfig, loading: configLoading } = usePusherConfig(streamerSlug);
  const { playAudio, unlockAudio, cleanup } = useWebAudioPlayer();
  
  const alertQueueRef = useRef<AlertDonation[]>([]);
  const isProcessingRef = useRef(false);
  const displayedIdsRef = useRef<Set<string>>(new Set());
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { topDonator, latestDonations } = useLeaderboard({
    streamerSlug: config.slug,
    donationsTable: config.tableName,
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
  });

  // CRITICAL FIX #1: Unlock audio on first user interaction
  const handleUnlockClick = useCallback(async () => {
    const success = await unlockAudio();
    if (success) {
      setAudioUnlocked(true);
      console.log('[Alert] Audio unlocked via user click');
    }
  }, [unlockAudio]);

  // Resolve audio URL from type + donation ID (FIX #2: URLs not in payloads)
  const resolveAudioUrl = useCallback((
    streamerId: string,
    donationId: string,
    audioType: 'tts' | 'voice' | 'hypersound'
  ): string => {
    switch (audioType) {
      case 'tts':
        return `${R2_BASE_URL}/tts-audio/${streamerId}/${donationId}.mp3`;
      case 'voice':
        return `${R2_BASE_URL}/voice-messages/${streamerId}/${donationId}.webm`;
      case 'hypersound':
        // Hypersounds use direct URLs from database - handled separately
        return '';
      default:
        return '';
    }
  }, []);

  // Process next alert from queue
  const processNextAlert = useCallback(async () => {
    if (isProcessingRef.current || alertQueueRef.current.length === 0) {
      return;
    }

    const nextAlert = alertQueueRef.current.shift()!;
    isProcessingRef.current = true;

    // CRITICAL FIX #3: Skip if already displayed
    if (displayedIdsRef.current.has(nextAlert.id)) {
      console.log('[Alert] Skipping duplicate:', nextAlert.id);
      isProcessingRef.current = false;
      processNextAlert();
      return;
    }

    displayedIdsRef.current.add(nextAlert.id);
    console.log('[Alert] Processing:', nextAlert.id);

    // Show visual alert
    setCurrentAlert(nextAlert);
    setIsVisible(true);

    // Play audio if available
    if (nextAlert.has_audio && nextAlert.audio_type && streamerId) {
      // CRITICAL FIX #1: Try to unlock audio on first event (fallback)
      if (!audioUnlocked) {
        const unlockSuccess = await unlockAudio();
        if (unlockSuccess) {
          setAudioUnlocked(true);
        }
      }

      const audioUrl = resolveAudioUrl(streamerId, nextAlert.id, nextAlert.audio_type);
      
      if (audioUrl) {
        await playAudio(audioUrl, nextAlert.id, () => {
          // Audio ended - hide alert after short delay
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => {
              setCurrentAlert(null);
              isProcessingRef.current = false;
              processNextAlert();
            }, 500);
          }, 500);
        });
      } else {
        // For hypersound or other cases where URL resolution fails, use timer
        const duration = nextAlert.is_hyperemote ? 8000 : 5000;
        hideTimeoutRef.current = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => {
            setCurrentAlert(null);
            isProcessingRef.current = false;
            processNextAlert();
          }, 500);
        }, duration);
      }
    } else {
      // No audio - use timer for display duration
      const duration = nextAlert.is_hyperemote ? 8000 : 5000;
      
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setCurrentAlert(null);
          isProcessingRef.current = false;
          processNextAlert();
        }, 500);
      }, duration);
    }
  }, [audioUnlocked, streamerId, playAudio, resolveAudioUrl, unlockAudio]);

  // Add alert to queue
  const addToQueue = useCallback((donation: AlertDonation) => {
    // CRITICAL FIX #3: Check for duplicates
    if (displayedIdsRef.current.has(donation.id)) {
      console.log('[Alert] Already displayed:', donation.id);
      return;
    }
    
    if (alertQueueRef.current.some(d => d.id === donation.id)) {
      console.log('[Alert] Already in queue:', donation.id);
      return;
    }

    console.log('[Alert] Adding to queue:', donation.id);
    alertQueueRef.current.push(donation);
    processNextAlert();
  }, [processNextAlert]);

  // Fetch initial settings and streamer ID
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('streamers')
        .select('id, alert_box_scale, leaderboard_widget_enabled, brand_color')
        .eq('streamer_slug', config.slug)
        .single();
      
      if (!error && data) {
        setStreamerId(data.id);
        if (data.alert_box_scale) setAlertBoxScale(Number(data.alert_box_scale));
        if (data.leaderboard_widget_enabled !== null) setLeaderboardEnabled(data.leaderboard_widget_enabled);
        if (data.brand_color) setBrandColor(data.brand_color);
      }
    };
    fetchSettings();
  }, [config.slug]);

  // Pusher subscription
  useEffect(() => {
    if (!pusherConfig?.key) return;

    const pusher = new Pusher(pusherConfig.key, {
      cluster: pusherConfig.cluster,
    });

    pusher.connection.bind('connected', () => setConnectionStatus('connected'));
    pusher.connection.bind('disconnected', () => setConnectionStatus('disconnected'));

    // Subscribe to alerts channel
    const alertsChannel = pusher.subscribe(config.pusherAlertsChannel);
    
    // Listen for audio-now-playing (primary trigger from get-current-audio)
    alertsChannel.bind('audio-now-playing', (data: any) => {
      console.log('[Pusher] audio-now-playing:', data.id);
      
      // Transform payload - determine audio type from flags
      // After migration, payloads will use has_audio/audio_type flags
      // For backward compatibility, also check for legacy URL fields
      const hasAudio = data.has_audio ?? !!(data.tts_audio_url || data.voice_message_url || data.hypersound_url);
      const audioType = data.audio_type ?? (
        data.hypersound_url ? 'hypersound' : 
        data.voice_message_url ? 'voice' : 
        data.tts_audio_url ? 'tts' : undefined
      );
      
      const alert: AlertDonation = {
        id: data.id,
        name: data.name,
        amount: data.amount,
        currency: data.currency,
        message: data.message,
        has_audio: hasAudio,
        audio_type: audioType,
        is_hyperemote: data.is_hyperemote,
        media_url: data.media_url,
        media_type: data.media_type,
      };
      
      addToQueue(alert);
    });

    // Settings channel for real-time updates
    const settingsChannel = pusher.subscribe(config.pusherSettingsChannel);
    settingsChannel.bind('settings-updated', (data: any) => {
      if (data.brand_color) setBrandColor(data.brand_color);
      if (data.alert_box_scale) setAlertBoxScale(Number(data.alert_box_scale));
      if (data.leaderboard_widget_enabled !== undefined) {
        setLeaderboardEnabled(data.leaderboard_widget_enabled);
      }
    });

    return () => {
      alertsChannel.unbind_all();
      settingsChannel.unbind_all();
      pusher.unsubscribe(config.pusherAlertsChannel);
      pusher.unsubscribe(config.pusherSettingsChannel);
      pusher.disconnect();
    };
  }, [pusherConfig, config, addToQueue]);

  // Cleanup on unmount
  useEffect(() => {
    // Clear displayed IDs periodically to prevent memory growth
    const interval = setInterval(() => {
      displayedIdsRef.current.clear();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      cleanup();
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [cleanup]);

  if (configLoading) {
    return (
      <div className="fixed inset-0 bg-transparent flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const widgetStoragePrefix = storagePrefix || streamerSlug.replace('_', '-');

  return (
    <div className="fixed inset-0 bg-transparent">
      {/* Audio unlock overlay - shown once on load */}
      {!audioUnlocked && (
        <button
          onClick={handleUnlockClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 cursor-pointer"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="text-white text-xl mb-2">Click to Enable Audio</div>
            <div className="text-white/70 text-sm">Required for OBS Browser Source</div>
          </div>
        </button>
      )}

      {/* Visual alert */}
      <UnifiedAlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        brandColor={brandColor}
        scale={alertBoxScale}
      />

      {/* Leaderboard widget */}
      {leaderboardEnabled && (
        <ResizableWidget
          id="leaderboard"
          storagePrefix={widgetStoragePrefix}
          defaultState={{ x: 20, y: 20, width: 400, height: 120 }}
        >
          <LeaderboardWidget
            topDonator={topDonator}
            latestDonations={latestDonations}
            brandColor={brandColor}
          />
        </ResizableWidget>
      )}

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs">
          <div>Status: {connectionStatus}</div>
          <div>Audio: {audioUnlocked ? '🔊 Unlocked' : '🔇 Locked'}</div>
          <div>Queue: {alertQueueRef.current.length}</div>
        </div>
      )}
    </div>
  );
};

export default BrowserSourceAlertWithAudio;
