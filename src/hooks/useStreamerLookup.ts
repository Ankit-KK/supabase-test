import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StreamerData {
  id: string;
  streamer_slug: string;
  streamer_name: string;
  brand_color: string;
}

export const useStreamerLookup = (streamerSlug: string) => {
  const [streamerData, setStreamerData] = useState<StreamerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStreamerData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('streamers')
          .select('id, streamer_slug, streamer_name, brand_color')
          .eq('streamer_slug', streamerSlug)
          .single();

        if (error) {
          console.error('Error fetching streamer:', error);
          setError(error.message);
          return;
        }

        setStreamerData(data);
      } catch (err) {
        console.error('Error in fetchStreamerData:', err);
        setError('Failed to fetch streamer data');
      } finally {
        setLoading(false);
      }
    };

    if (streamerSlug) {
      fetchStreamerData();
    }
  }, [streamerSlug]);

  return { streamerData, loading, error };
};