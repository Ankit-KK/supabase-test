import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Streamer configuration mapping
const STREAMER_CONFIG: Record<string, { table: string; prefix: string }> = {
  'abdevil': { table: 'abdevil_donations', prefix: 'ab_rp_' },
  'ankit': { table: 'ankit_donations', prefix: 'ank_rp_' },
  'bongflick': { table: 'bongflick_donations', prefix: 'bf_rp_' },
  'chiaa_gaming': { table: 'chiaa_gaming_donations', prefix: 'cg_rp_' },
  'clumsygod': { table: 'clumsygod_donations', prefix: 'clg_rp_' },
  'damask_plays': { table: 'damask_plays_donations', prefix: 'dp_rp_' },
  'jhanvoo': { table: 'jhanvoo_donations', prefix: 'jh_rp_' },
  'jimmy_gaming': { table: 'jimmy_gaming_donations', prefix: 'jg_rp_' },
  'looteriya_gaming': { table: 'looteriya_gaming_donations', prefix: 'lg_rp_' },
  'mriqmaster': { table: 'mriqmaster_donations', prefix: 'mi_rp_' },
  'neko_xenpai': { table: 'neko_xenpai_donations', prefix: 'nx_rp_' },
  'notyourkween': { table: 'notyourkween_donations', prefix: 'nyk_rp_' },
  'sagarujjwalgaming': { table: 'sagarujjwalgaming_donations', prefix: 'sug_rp_' },
  'sizzors': { table: 'sizzors_donations', prefix: 'sz_rp_' },
  'thunderx': { table: 'thunderx_donations', prefix: 'tx_rp_' },
  'vipbhai': { table: 'vipbhai_donations', prefix: 'vb_rp_' },
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

const CURRENCY_MINIMUMS: Record<string, { minText: number; minVoice: number; minHypersound: number }> = {
  'INR': { minText: 40, minVoice: 150, minHypersound: 30 },
  'USD': { minText: 1, minVoice: 3, minHypersound: 1 },
  'EUR': { minText: 1, minVoice: 3, minHypersound: 1 },
  'GBP': { minText: 1, minVoice: 3, minHypersound: 1 },
  'AED': { minText: 4, minVoice: 12, minHypersound: 3 },
  'AUD': { minText: 2, minVoice: 5, minHypersound: 1.5 },
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

    // Get currency minimums
    const minimums = CURRENCY_MINIMUMS[currency] || CURRENCY_MINIMUMS['INR'];

    // Validate minimum amounts based on donation type
    if (hypersoundUrl && amount < minimums.minHypersound) {
      throw new Error(`HyperSounds require minimum ${currency} ${minimums.minHypersound}`);
    }

    if (voiceMessageUrl && amount < minimums.minVoice) {
      throw new Error(`Voice messages require minimum ${currency} ${minimums.minVoice}`);
    }

    if (!hypersoundUrl && !voiceMessageUrl && amount < minimums.minText) {
      throw new Error(`Text messages require minimum ${currency} ${minimums.minText}`);
    }

    // Get streamer info
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('id, streamer_name')
      .eq('streamer_slug', streamer_slug)
      .single();

    if (streamerError || !streamerData) {
      console.error(`[Unified] Streamer lookup error for ${streamer_slug}:`, streamerError);
      throw new Error('Streamer not found');
    }

    // Generate unique order ID with streamer-specific prefix
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const orderId = `${config.prefix}${timestamp}_${randomString}`;

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

    // Store donation in the streamer-specific table
    const { data: donation, error: donationError } = await supabase
      .from(config.table)
      .insert({
        streamer_id: streamerData.id,
        name: sanitizedName,
        amount,
        currency: currency,
        message: sanitizedMessage,
        voice_message_url: voiceMessageUrl || null,
        hypersound_url: hypersoundUrl || null,
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
