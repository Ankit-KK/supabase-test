import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PusherConfig {
  key: string;
  cluster: string;
  group?: number;
  streamer?: string;
}

interface CachedConfig {
  data: PusherConfig;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (streamerSlug: string) => `pusher-config-${streamerSlug}`;

const getCachedConfig = (streamerSlug: string): PusherConfig | null => {
  try {
    const cached = localStorage.getItem(getCacheKey(streamerSlug));
    if (!cached) return null;
    
    const { data, timestamp }: CachedConfig = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(getCacheKey(streamerSlug));
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
};

const setCachedConfig = (streamerSlug: string, data: PusherConfig) => {
  try {
    const cached: CachedConfig = { data, timestamp: Date.now() };
    localStorage.setItem(getCacheKey(streamerSlug), JSON.stringify(cached));
  } catch {
    // localStorage might be full or disabled
  }
};

export const usePusherConfig = (streamerSlug: string) => {
  const [config, setConfig] = useState<PusherConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!streamerSlug) {
      setError('streamerSlug is required');
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = getCachedConfig(streamerSlug);
    if (cached) {
      console.log(`[usePusherConfig] Using cached config for ${streamerSlug} (Group ${cached.group})`);
      setConfig(cached);
      setLoading(false);
      return;
    }

    const fetchConfig = async () => {
      try {
        console.log(`[usePusherConfig] Fetching config for: ${streamerSlug}`);
        
        const { data, error } = await supabase.functions.invoke('get-pusher-config', {
          body: { streamer_slug: streamerSlug }
        });
        
        if (error) throw error;
        
        if (!data || !data.key || !data.cluster) {
          throw new Error('Invalid Pusher configuration received');
        }
        
        console.log(`[usePusherConfig] Loaded Group ${data.group} config for ${streamerSlug}`);
        setCachedConfig(streamerSlug, data);
        setConfig(data);
      } catch (err) {
        console.error('[usePusherConfig] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load config');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [streamerSlug]);

  return { config, loading, error };
};