import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StreamerPricing {
  minText: number;
  minTts: number;
  minVoice: number;
  minHypersound: number;
  minMedia: number;
  ttsEnabled: boolean;
  currency: string;
}

// Default fallback values (platform floors)
const DEFAULT_PRICING: StreamerPricing = {
  minText: 40,
  minTts: 40,
  minVoice: 150,
  minHypersound: 30,
  minMedia: 100,
  ttsEnabled: true,
  currency: 'INR',
};

export const useStreamerPricing = (streamerSlug: string, currency: string) => {
  const [pricing, setPricing] = useState<StreamerPricing>({ ...DEFAULT_PRICING, currency });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPricing = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase.functions.invoke('get-streamer-pricing', {
          body: { streamer_slug: streamerSlug, currency },
        });

        if (fetchError) {
          console.error('[useStreamerPricing] Error fetching pricing:', fetchError);
          throw new Error(fetchError.message);
        }

        if (data) {
          setPricing({
            minText: data.minText,
            minTts: data.minTts,
            minVoice: data.minVoice,
            minHypersound: data.minHypersound,
            minMedia: data.minMedia,
            ttsEnabled: data.ttsEnabled ?? true,
            currency: data.currency || currency,
          });
        }
      } catch (err) {
        console.error('[useStreamerPricing] Failed to fetch pricing:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch pricing');
        // Keep using previous pricing or defaults
      } finally {
        setIsLoading(false);
      }
    };

    fetchPricing();
  }, [streamerSlug, currency]);

  return { pricing, isLoading, error };
};
