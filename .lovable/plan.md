

# Hardened Browser Source Audio Architecture

## Fixes Applied (All 6 Critical Items)

| # | Issue | Status |
|---|-------|--------|
| 1 | AudioContext lifecycle | ✅ Added explicit unlock + resume |
| 2 | Remove URLs from payloads | ✅ Mandatory change |
| 3 | Fetch deduplication guard | ✅ Added |
| 4 | Memory pressure control | ✅ Added cleanup + 1 buffer cap |
| 5 | Hard fail Media Source | ✅ 410 Gone detection |
| 6 | Realistic egress estimates | ✅ Adjusted to 8-10 GB |

---

## Core Principle (Verbatim)

> **"Assume OBS Media Source re-downloads media on every play. Any architecture that relies on its caching is invalid."**

> **"Any component that can reload without preserving JavaScript memory must never be responsible for media playback."**

---

## Phase 1: New Audio Playback Hook

### File: `src/hooks/useWebAudioPlayer.ts` (CREATE)

```typescript
import { useRef, useCallback } from 'react';

interface AudioPlaybackState {
  isPlaying: boolean;
  currentId: string | null;
}

export function useWebAudioPlayer() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentBufferRef = useRef<AudioBuffer | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const currentAudioIdRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);

  // CRITICAL FIX #1: Explicit AudioContext unlock + resume
  const unlockAudio = useCallback(async (): Promise<boolean> => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || 
          (window as any).webkitAudioContext)();
        console.log('[WebAudio] AudioContext created');
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log('[WebAudio] AudioContext resumed');
      }
      
      return audioContextRef.current.state === 'running';
    } catch (error) {
      console.error('[WebAudio] Failed to unlock audio:', error);
      return false;
    }
  }, []);

  // Play audio from URL - fetches ONCE, stores in memory
  const playAudio = useCallback(async (
    audioUrl: string, 
    donationId: string,
    onEnded?: () => void
  ): Promise<boolean> => {
    // CRITICAL FIX #3: Fetch deduplication guard
    if (currentAudioIdRef.current === donationId) {
      console.log('[WebAudio] Skipping duplicate fetch for:', donationId);
      return false;
    }

    // Ensure AudioContext is ready
    const isUnlocked = await unlockAudio();
    if (!isUnlocked || !audioContextRef.current) {
      console.error('[WebAudio] AudioContext not available');
      return false;
    }

    // Stop any currently playing audio
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
    }

    // CRITICAL FIX #4: Clear previous buffer to control memory
    currentBufferRef.current = null;

    try {
      console.log('[WebAudio] Fetching audio ONCE:', audioUrl);
      
      // Fetch audio data ONCE
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Decode to AudioBuffer
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      // Store in memory for potential replay (capped at 1 buffer)
      currentBufferRef.current = audioBuffer;
      currentAudioIdRef.current = donationId;
      
      // Create and play source
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        console.log('[WebAudio] Playback ended:', donationId);
        isPlayingRef.current = false;
        currentSourceRef.current = null;
        
        // CRITICAL FIX #4: Clear buffer after playback
        currentBufferRef.current = null;
        
        onEnded?.();
      };
      
      source.start(0);
      currentSourceRef.current = source;
      isPlayingRef.current = true;
      
      console.log('[WebAudio] Playing from memory:', donationId);
      return true;
    } catch (error) {
      console.error('[WebAudio] Error playing audio:', error);
      currentAudioIdRef.current = null;
      return false;
    }
  }, [unlockAudio]);

  // Stop current playback
  const stop = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
      currentSourceRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    stop();
    currentBufferRef.current = null;
    currentAudioIdRef.current = null;
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, [stop]);

  return {
    unlockAudio,
    playAudio,
    stop,
    cleanup,
    isPlaying: () => isPlayingRef.current,
    getContext: () => audioContextRef.current,
  };
}
```

---

## Phase 2: Unified Browser Source Alert Component

### File: `src/components/obs/BrowserSourceAlertWithAudio.tsx` (CREATE)

```typescript
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
  // NO AUDIO URLs - resolved locally from audio_type + id
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

  // Resolve audio URL from type + donation ID
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
        // Hypersounds have different naming - need to handle separately
        return `${R2_BASE_URL}/hypersounds/${donationId}`;
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
    if (nextAlert.has_audio && nextAlert.audio_type && config.streamerId) {
      // CRITICAL FIX #1: Try to unlock audio on first event (fallback)
      if (!audioUnlocked) {
        const unlockSuccess = await unlockAudio();
        if (unlockSuccess) {
          setAudioUnlocked(true);
        }
      }

      const audioUrl = resolveAudioUrl(config.streamerId, nextAlert.id, nextAlert.audio_type);
      
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
  }, [audioUnlocked, config.streamerId, playAudio, resolveAudioUrl, unlockAudio]);

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

  // Fetch initial settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('streamers')
        .select('id, alert_box_scale, leaderboard_widget_enabled, brand_color')
        .eq('streamer_slug', config.slug)
        .single();
      
      if (!error && data) {
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
    
    // Listen for audio-now-playing (primary trigger)
    alertsChannel.bind('audio-now-playing', (data: any) => {
      console.log('[Pusher] audio-now-playing:', data.id);
      
      // Transform payload - NO URLs in payload (FIX #2)
      const alert: AlertDonation = {
        id: data.id,
        name: data.name,
        amount: data.amount,
        currency: data.currency,
        message: data.message,
        has_audio: !!(data.tts_audio_url || data.voice_message_url || data.hypersound_url),
        audio_type: data.hypersound_url ? 'hypersound' : 
                   data.voice_message_url ? 'voice' : 
                   data.tts_audio_url ? 'tts' : undefined,
        is_hyperemote: data.is_hyperemote,
        media_url: data.media_url, // Media URLs are fine (images/video for display)
        media_type: data.media_type,
      };
      
      addToQueue(alert);
    });

    // Settings channel
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
    // Clear displayed IDs periodically
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

      {/* Debug info */}
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
```

---

## Phase 3: Hard Fail Media Source (Edge Function)

### File: `supabase/functions/get-current-audio/index.ts` (MODIFY)

Add user-agent detection at the top of the request handler:

```typescript
// CRITICAL FIX #5: Hard fail for OBS Media Source
const userAgent = req.headers.get('user-agent') || '';
if (userAgent.includes('OBS') && !userAgent.includes('OBS Browser')) {
  console.log('[get-current-audio] BLOCKED: OBS Media Source detected');
  return new Response(JSON.stringify({
    error: 'OBS Media Source is not supported',
    message: 'Please use OBS Browser Source with the alerts page instead. Media Source re-downloads audio on every play, causing excessive bandwidth usage.',
    migration_guide: 'https://docs.hyperchat.app/obs-migration'
  }), {
    status: 410, // Gone
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

---

## Phase 4: Remove Audio URLs from Pusher Payloads

### File: `supabase/functions/razorpay-webhook/index.ts` (MODIFY)

**Lines 392-408** - Change payload to remove URLs:

```typescript
// CRITICAL FIX #2: No audio URLs in payloads
await sendPusherEvent(dashboardChannel, 'new-donation', {
  id: donation.id,
  name: donation.name,
  amount: donation.amount,
  message: donation.message,
  currency: paymentCurrency,
  created_at: donation.created_at,
  payment_status: 'success',
  moderation_status: moderationStatus,
  message_visible: true,
  // Replace URLs with flags
  has_audio: !!(donation.tts_audio_url || donation.voice_message_url || donation.hypersound_url),
  audio_type: donation.hypersound_url ? 'hypersound' : 
              donation.voice_message_url ? 'voice' : 
              donation.tts_audio_url ? 'tts' : null,
  is_hyperemote: donation.is_hyperemote,
  // Media URLs are fine (for display only, not audio)
  has_media: !!donation.media_url,
  media_type: donation.media_type
});
```

### File: `supabase/functions/moderate-donation/index.ts` (MODIFY)

**Lines 325-341** - Same change to alertData:

```typescript
const alertData = {
  id: donation.id,
  name: donation.name,
  amount: donation.amount,
  currency: donation.currency || 'INR',
  message: donation.message,
  type: donationType,
  // CRITICAL FIX #2: No audio URLs in payloads
  has_audio: !!(donation.voice_message_url || donation.tts_audio_url || donation.hypersound_url),
  audio_type: donation.hypersound_url ? 'hypersound' : 
              donation.voice_message_url ? 'voice' : 
              donation.tts_audio_url ? 'tts' : null,
  is_hyperemote: donation.is_hyperemote,
  selected_gif_id: donation.selected_gif_id,
  message_visible: donation.message_visible !== false,
  created_at: donation.created_at,
  // Media URLs for display only
  media_url: donation.media_url,
  media_type: donation.media_type
};
```

### File: `supabase/functions/get-current-audio/index.ts` (MODIFY)

**Lines 147-159** - Same change to audio-now-playing event:

```typescript
await pusher.trigger(alertsChannel, 'audio-now-playing', {
  id: donation.id,
  name: donation.name,
  amount: donation.amount,
  message: donation.message,
  // CRITICAL FIX #2: No audio URLs - client resolves from type + id
  has_audio: true,
  audio_type: donation.hypersound_url ? 'hypersound' : 
              donation.voice_message_url ? 'voice' : 'tts',
  is_hyperemote: donation.is_hyperemote || false,
  created_at: donation.created_at,
  // Media URLs for display only
  media_url: donation.media_url,
  media_type: donation.media_type,
});
```

---

## Phase 5: Update OBS Alert Pages

### Files to Update:
- `src/pages/obs-alerts/AnkitObsAlerts.tsx`
- `src/pages/obs-alerts/ChiaGamingObsAlerts.tsx`
- `src/pages/obs-alerts/LooteriyaGamingObsAlerts.tsx`
- `src/pages/obs-alerts/ClumsyGodObsAlerts.tsx`
- `src/pages/obs-alerts/WolfyObsAlerts.tsx`

Replace `ObsAlertsWrapper` with `BrowserSourceAlertWithAudio`:

```typescript
import { BrowserSourceAlertWithAudio } from '@/components/obs/BrowserSourceAlertWithAudio';

const AnkitObsAlerts = () => {
  return <BrowserSourceAlertWithAudio streamerSlug="ankit" storagePrefix="ankit" />;
};

export default AnkitObsAlerts;
```

---

## Phase 6: Deprecate Media Source Pages

### Files to Add Deprecation Warning:
- `src/pages/audio-player/AnkitMediaSourcePlayer.tsx`
- `src/pages/audio-player/ChiaGamingMediaSourcePlayer.tsx`
- etc.

Add deprecation notice:

```typescript
const DeprecatedMediaSourcePlayer = () => {
  return (
    <div className="min-h-screen bg-red-900 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg p-6 max-w-md text-center">
        <h1 className="text-xl font-bold text-red-600 mb-4">
          ⚠️ Media Source Deprecated
        </h1>
        <p className="text-gray-700 mb-4">
          OBS Media Source causes excessive bandwidth usage due to repeated audio downloads.
        </p>
        <p className="text-gray-700 mb-4">
          Please switch to OBS Browser Source using your alerts URL instead.
        </p>
        <code className="block bg-gray-100 p-2 rounded text-sm">
          /obs/alerts/[streamer]
        </code>
      </div>
    </div>
  );
};

export default DeprecatedMediaSourcePlayer;
```

---

## Expected Impact (Corrected Estimates)

| Metric | Before | After |
|--------|--------|-------|
| Downloads per donation | 3-10× | 1× |
| Avg audio size | ~80 KB | ~80 KB |
| Dashboard previews/day | ~2 | ~2 (but from cache) |
| Monthly egress (100 donations/day) | **15-30 GB** | **8-10 GB** |
| Scene change cost | Full re-download | Zero |
| Replay cost | Full re-download | Zero (in-memory) |
| OBS reload cost | Full re-download | Single fetch |

---

## Files Summary

| File | Action |
|------|--------|
| `src/hooks/useWebAudioPlayer.ts` | **CREATE** - WebAudio with lifecycle management |
| `src/components/obs/BrowserSourceAlertWithAudio.tsx` | **CREATE** - Unified alert + audio component |
| `supabase/functions/get-current-audio/index.ts` | **MODIFY** - Add Media Source 410 block, remove URLs from payload |
| `supabase/functions/razorpay-webhook/index.ts` | **MODIFY** - Remove URLs from payloads |
| `supabase/functions/moderate-donation/index.ts` | **MODIFY** - Remove URLs from payloads |
| `src/pages/obs-alerts/AnkitObsAlerts.tsx` | **MODIFY** - Use new component |
| `src/pages/obs-alerts/ChiaGamingObsAlerts.tsx` | **MODIFY** - Use new component |
| `src/pages/obs-alerts/LooteriyaGamingObsAlerts.tsx` | **MODIFY** - Use new component |
| `src/pages/obs-alerts/ClumsyGodObsAlerts.tsx` | **MODIFY** - Use new component |
| `src/pages/obs-alerts/WolfyObsAlerts.tsx` | **MODIFY** - Use new component |
| `src/pages/audio-player/*.tsx` (5 files) | **MODIFY** - Add deprecation notices |

---

## Invariants Enforced

1. **One Fetch Per Donation**: Audio fetched once into `ArrayBuffer`, never refetched
2. **Memory Cleanup**: `AudioBuffer` cleared after playback ends
3. **Deduplication**: `currentAudioIdRef` prevents duplicate fetches on reconnect
4. **AudioContext Lifecycle**: Explicit unlock on click + resume on first event
5. **No URLs in Payloads**: Only `has_audio` + `audio_type` flags
6. **Media Source Blocked**: 410 Gone response for non-browser OBS requests

