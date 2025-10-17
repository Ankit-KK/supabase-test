import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PusherConfig {
  key: string;
  cluster: string;
}

export const usePusherConfig = () => {
  const [config, setConfig] = useState<PusherConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        console.log('[PusherConfig] Fetching Pusher configuration from backend...');
        
        const { data, error } = await supabase.functions.invoke('get-pusher-config');
        
        if (error) throw error;
        
        if (!data || !data.key || !data.cluster) {
          throw new Error('Invalid Pusher configuration received');
        }
        
        console.log('[PusherConfig] Configuration loaded successfully');
        setConfig(data);
      } catch (err) {
        console.error('[PusherConfig] Failed to fetch Pusher config:', err);
        setError(err instanceof Error ? err.message : 'Failed to load config');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, loading, error };
};