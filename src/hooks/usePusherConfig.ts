import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PusherConfig {
  key: string;
  cluster: string;
  group?: number;
  streamer?: string;
}

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