import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Active streamer configuration mapping
const STREAMER_CONFIG: Record<string, { table: string; prefix: string; tableId: number }> = {
  'ankit': { table: 'ankit_donations', prefix: 'ank_rp_', tableId: 0 },
  'chiaa_gaming': { table: 'chiaa_gaming_donations', prefix: 'cg_rp_', tableId: 1 },
  'looteriya_gaming': { table: 'looteriya_gaming_donations', prefix: 'lg_rp_', tableId: 2 },
  'clumsy_god': { table: 'clumsy_god_donations', prefix: 'cg2_rp_', tableId: 3 },
  'wolfy': { table: 'wolfy_donations', prefix: 'wf_rp_', tableId: 4 },
  'dorp_plays': { table: 'dorp_plays_donations', prefix: 'dp2_rp_', tableId: 5 },
  'zishu': { table: 'zishu_donations', prefix: 'zs_rp_', tableId: 6 },
  'brigzard': { table: 'brigzard_donations', prefix: 'bz_rp_', tableId: 7 },
  'w_era': { table: 'w_era_donations', prefix: 'we_rp_', tableId: 8 },
  'mr_champion': { table: 'mr_champion_donations', prefix: 'mc_rp_', tableId: 9 },
  'demigod': { table: 'demigod_donations', prefix: 'dg_rp_', tableId: 10 },
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

// XSS sanitization for user input
const sanitizeInput = (input: string | null | undefined): string | null => {
  if (!input) return null;
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .substring(0, 500);
};

const sanitizeName = (name: string | null | undefined): string => {
  if (!name) return '';
  return sanitizeInput(name)?.substring(0, 100) || '';
};

// Crypto helper: generate random hex token and SHA-256 hash
const generateStatusToken = async (): Promise<{ token: string; hash: string }> => {
  const array = new Uint8Array(32); // 256 bits
  crypto.getRandomValues(array);
  const token = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const hash = Array.from(new Uint8Array(hashBuffer), b => b.toString(16).padStart(2, '0')).join('');
  return { token, hash };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      streamer_slug, 
      name, 
      amount, 
      message, 
      voiceMessageUrl, 
      hypersoundUrl,
      mediaUrl,
      mediaType,
      currency = 'INR' 
    } = await req.json();

    console.log(`[Unified] Creating order for streamer: ${streamer_slug}`);

    // Validate streamer_slug
    if (!streamer_slug || !STREAMER_CONFIG[streamer_slug]) {
      throw new Error(`Invalid or missing streamer_slug: ${streamer_slug}`);
    }

    const config = STREAMER_CONFIG[streamer_slug];

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const razorpayKeyId = Deno.env.get('razorpay-keyid');
    const razorpayKeySecret = Deno.env.get('razorpay-keysecret');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    // Validate inputs
    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }

    if (!amount || amount <= 0) {
      throw new Error('Valid amount is required');
    }

    // Fetch streamer with custom minimums
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('id, streamer_name, min_text_amount_inr, min_tts_amount_inr, min_voice_amount_inr, min_hypersound_amount_inr, media_min_amount, tts_enabled, message_char_tiers')
      .eq('streamer_slug', streamer_slug)
      .single();

    if (streamerError || !streamerData) {
      console.error(`[Unified] Streamer lookup error for ${streamer_slug}:`, streamerError);
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

    console.log(`[Unified] Calculated minimums:`, minimums);

    // Validate minimum amounts based on donation type
    if (hypersoundUrl && amount < minimums.minHypersound) {
      throw new Error(`HyperSounds require minimum ${currency} ${minimums.minHypersound}`);
    }

    if (voiceMessageUrl && amount < minimums.minVoice) {
      throw new Error(`Voice messages require minimum ${currency} ${minimums.minVoice}`);
    }

    if (mediaUrl && amount < minimums.minMedia) {
      throw new Error(`Media messages require minimum ${currency} ${minimums.minMedia}`);
    }

    // Text donations always use minText - TTS is a bonus at higher amounts (₹70+)
    if (!hypersoundUrl && !voiceMessageUrl && !mediaUrl) {
      if (amount < minimums.minText) {
        throw new Error(`Text messages require minimum ${currency} ${minimums.minText}`);
      }
    }

    // Enforce tiered character limits if configured for this streamer
    if (streamerData.message_char_tiers && message) {
      const tiers = streamerData.message_char_tiers as Array<{ min_amount: number; max_chars: number }>;
      const amountInINR = amount * (EXCHANGE_RATES_TO_INR[currency] || 1);
      
      // Find the highest tier that the amount qualifies for
      const sortedTiers = [...tiers].sort((a, b) => b.min_amount - a.min_amount);
      const matchedTier = sortedTiers.find(t => amountInINR >= t.min_amount);
      
      if (matchedTier) {
        const maxChars = matchedTier.max_chars;
        const sanitizedMsg = sanitizeInput(message);
        if (sanitizedMsg && sanitizedMsg.length > maxChars) {
          console.log(`[Unified] Message too long: ${sanitizedMsg.length} chars, max ${maxChars} for ${amountInINR} INR`);
          throw new Error(`Message exceeds ${maxChars} character limit for this donation amount`);
        }
      }
    }

    // Generate unique order ID with streamer-specific prefix
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const orderId = `${config.prefix}${timestamp}_${randomString}`;

    // Compute amount_inr at write time (currency normalization)
    const amountInINR = amount * (EXCHANGE_RATES_TO_INR[currency] || 1);

    // Convert amount to subunits
    const amountInSubunits = Math.round(amount * 100);

    // Create Razorpay order
    const razorpayOrderData = {
      amount: amountInSubunits,
      currency: currency,
      receipt: orderId,
    };

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
      },
      body: JSON.stringify(razorpayOrderData),
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text();
      console.error('[Unified] Razorpay order creation failed:', errorData);
      throw new Error('Failed to create payment order');
    }

    const razorpayOrder = await razorpayResponse.json();

    // Sanitize user inputs
    const sanitizedName = sanitizeName(name);
    const sanitizedMessage = sanitizeInput(message);

    if (!sanitizedName) {
      throw new Error('Invalid name provided');
    }

    // Store donation in the streamer-specific table (with amount_inr)
    const { data: donation, error: donationError } = await supabase
      .from(config.table)
      .insert({
        streamer_id: streamerData.id,
        name: sanitizedName,
        amount,
        amount_inr: amountInINR,
        currency: currency,
        message: sanitizedMessage,
        voice_message_url: voiceMessageUrl || null,
        hypersound_url: hypersoundUrl || null,
        media_url: mediaUrl || null,
        media_type: mediaType || null,
        is_hyperemote: false,
        order_id: orderId,
        razorpay_order_id: razorpayOrder.id,
        payment_status: 'pending',
        moderation_status: 'pending',
      })
      .select()
      .single();

    if (donationError) {
      console.error(`[Unified] Database insert error for ${streamer_slug}:`, donationError);
      throw new Error('Failed to store donation');
    }

    // Insert into order_lookup for fast webhook resolution (replaces 10-table scan)
    const { error: lookupError } = await supabase
      .from('order_lookup')
      .insert({
        razorpay_order_id: razorpayOrder.id,
        order_id: orderId,
        streamer_slug: streamer_slug,
        donation_table_id: config.tableId,
        donation_id: donation.id,
      });

    if (lookupError) {
      console.error(`[Unified] order_lookup insert error:`, lookupError);
      // Non-fatal: webhook will still work via prefix-based lookup as fallback
    }

    console.log(`[Unified] Donation created for ${streamer_slug}:`, donation.id);

    return new Response(
      JSON.stringify({
        orderId: orderId,
        razorpay_order_id: razorpayOrder.id,
        razorpay_key_id: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        donationId: donation.id,
        internalOrderId: orderId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[Unified] Error in create-razorpay-order-unified:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
