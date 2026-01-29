import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Platform floors (cannot go below these)
const PLATFORM_FLOORS_INR = { 
  text: 40, 
  tts: 40, 
  voice: 150, 
  hypersound: 30, 
  media: 100 
};

// Exchange rates to INR
const EXCHANGE_RATES_TO_INR: Record<string, number> = { 
  INR: 1, 
  USD: 89, 
  EUR: 94, 
  GBP: 113, 
  AED: 24, 
  AUD: 57 
};

// Auto-rounding function for nice currency display
const roundToNice = (value: number, currency: string): number => {
  if (currency === 'INR') return Math.ceil(value / 10) * 10;
  if (currency === 'AED') return Math.ceil(value);
  return Math.ceil(value * 2) / 2; // USD/EUR/GBP/AUD to nearest 0.50
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { streamer_slug, currency = 'INR' } = await req.json();

    if (!streamer_slug) {
      throw new Error('streamer_slug is required');
    }

    console.log(`[Pricing] Fetching pricing for ${streamer_slug} in ${currency}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch streamer with custom minimums
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('id, streamer_name, min_text_amount_inr, min_tts_amount_inr, min_voice_amount_inr, min_hypersound_amount_inr, media_min_amount, tts_enabled')
      .eq('streamer_slug', streamer_slug)
      .single();

    if (streamerError || !streamerData) {
      console.error(`[Pricing] Streamer not found: ${streamer_slug}`, streamerError);
      throw new Error('Streamer not found');
    }

    // Calculate effective minimums in INR (MAX of platform floor and streamer custom)
    const effectiveINR = {
      text: Math.max(PLATFORM_FLOORS_INR.text, streamerData.min_text_amount_inr || 0),
      tts: Math.max(PLATFORM_FLOORS_INR.tts, streamerData.min_tts_amount_inr || 0),
      voice: Math.max(PLATFORM_FLOORS_INR.voice, streamerData.min_voice_amount_inr || 0),
      hypersound: Math.max(PLATFORM_FLOORS_INR.hypersound, streamerData.min_hypersound_amount_inr || 0),
      media: Math.max(PLATFORM_FLOORS_INR.media, streamerData.media_min_amount || 0),
    };

    // Convert to donor's currency with auto-rounding
    const rate = EXCHANGE_RATES_TO_INR[currency] || 1;
    const minimums = {
      minText: roundToNice(effectiveINR.text / rate, currency),
      minTts: roundToNice(effectiveINR.tts / rate, currency),
      minVoice: roundToNice(effectiveINR.voice / rate, currency),
      minHypersound: roundToNice(effectiveINR.hypersound / rate, currency),
      minMedia: roundToNice(effectiveINR.media / rate, currency),
    };

    console.log(`[Pricing] Calculated minimums for ${streamer_slug}:`, minimums);

    return new Response(
      JSON.stringify({
        ...minimums,
        ttsEnabled: streamerData.tts_enabled ?? true,
        currency,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[Pricing] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
