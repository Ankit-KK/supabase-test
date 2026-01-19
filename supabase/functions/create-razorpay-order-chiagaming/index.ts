import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// XSS sanitization for user input - removes dangerous HTML/script content
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
    .replace(/<[^>]*>/g, '') // Remove all remaining HTML tags
    .trim()
    .substring(0, 500); // Limit length
};

const sanitizeName = (name: string | null | undefined): string => {
  if (!name) return '';
  return sanitizeInput(name)?.substring(0, 100) || '';
};

// Get client IP from request headers
const getClientIP = (req: Request): string => {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         req.headers.get('cf-connecting-ip') ||
         'unknown';
};

const CURRENCY_MINIMUMS: Record<string, { text: number; voice: number; hypersound: number; media: number }> = {
  'INR': { text: 40, voice: 150, hypersound: 30, media: 100 },
  'USD': { text: 1, voice: 3, hypersound: 1, media: 2 },
  'EUR': { text: 1, voice: 3, hypersound: 1, media: 2 },
  'GBP': { text: 1, voice: 3, hypersound: 1, media: 2 },
  'AED': { text: 4, voice: 12, hypersound: 3, media: 8 },
  'AUD': { text: 2, voice: 5, hypersound: 1.5, media: 3 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);
    console.log('[ChiaGaming Order] Payment request from IP:', clientIP);

    // Check rate limit (10 requests per minute)
    const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc('check_rate_limit_v2', {
      p_ip_address: clientIP,
      p_endpoint: 'create-razorpay-order-chiagaming',
      p_max_requests: 10,
      p_window_seconds: 60
    });

    if (rateLimitError) {
      console.error('[ChiaGaming Order] Rate limit check error:', rateLimitError);
    }

    if (rateLimitOk === false) {
      console.log('[ChiaGaming Order] Rate limit exceeded for IP:', clientIP);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount, currency = 'INR', name, message, voiceMessageUrl, hypersoundUrl, mediaUrl, mediaType } = await req.json();

    console.log('[ChiaGaming Order] Creating order:', { amount, currency, name, hasMedia: !!mediaUrl });

    const mins = CURRENCY_MINIMUMS[currency] || CURRENCY_MINIMUMS['INR'];

    // Validate minimum amounts based on type
    if (mediaUrl && amount < mins.media) {
      throw new Error(`Minimum ${currency} ${mins.media} required for media uploads`);
    }
    if (hypersoundUrl && amount < mins.hypersound) {
      throw new Error(`Minimum ${currency} ${mins.hypersound} required for HyperSounds`);
    }
    if (voiceMessageUrl && amount < mins.voice) {
      throw new Error(`Minimum ${currency} ${mins.voice} required for voice messages`);
    }
    if (!mediaUrl && !hypersoundUrl && !voiceMessageUrl && amount < mins.text) {
      throw new Error(`Minimum ${currency} ${mins.text} required for text messages`);
    }

    // Get streamer ID
    const { data: streamerData, error: streamerError } = await supabase
      .from("streamers")
      .select("id")
      .eq("streamer_slug", "chiaa_gaming")
      .single();

    if (streamerError || !streamerData) {
      console.error('[ChiaGaming Order] Streamer not found:', streamerError);
      throw new Error("ChiaGaming streamer not found");
    }

    const streamerId = streamerData.id;

    // Generate internal order ID
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const internalOrderId = `chiagaming_rp_${timestamp}_${randomStr}`;

    console.log('[ChiaGaming Order] Generated internal order ID:', internalOrderId);

    // Get Razorpay credentials - USE STANDARDIZED NAMES (lowercase with hyphen)
    const razorpayKeyId = Deno.env.get('razorpay-keyid');
    const razorpayKeySecret = Deno.env.get('razorpay-keysecret');

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('[ChiaGaming Order] Razorpay credentials not configured');
      throw new Error('Razorpay credentials not configured');
    }

    // Calculate amount in subunits
    const amountInSubunits = Math.round(amount * 100);

    // Create Razorpay order
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
      },
      body: JSON.stringify({
        amount: amountInSubunits,
        currency: currency,
        receipt: internalOrderId,
      }),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error('Razorpay API error:', errorText);
      throw new Error('Failed to create Razorpay order');
    }

    const razorpayOrder = await razorpayResponse.json();

    console.log('[ChiaGaming Order] Razorpay order created:', razorpayOrder.id);

    // Sanitize user inputs to prevent XSS attacks
    const sanitizedName = sanitizeName(name);
    const sanitizedMessage = sanitizeInput(message);

    if (!sanitizedName) {
      throw new Error('Invalid name provided');
    }

    // Insert donation record with PENDING status
    const { data: donationData, error: insertError } = await supabase
      .from("chiaa_gaming_donations")
      .insert({
        name: sanitizedName,
        amount: amount,
        currency: currency,
        message: sanitizedMessage,
        voice_message_url: voiceMessageUrl || null,
        hypersound_url: hypersoundUrl || null,
        media_url: mediaUrl || null,
        media_type: mediaType || null,
        is_hyperemote: !!hypersoundUrl,
        order_id: internalOrderId,
        razorpay_order_id: razorpayOrder.id,
        payment_status: "pending",
        moderation_status: "pending",
        streamer_id: streamerId,
        message_visible: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[ChiaGaming Order] Insert error:', insertError);
      throw insertError;
    }

    console.log('[ChiaGaming Order] Donation record created:', donationData.id);

    return new Response(
      JSON.stringify({
        orderId: internalOrderId,
        razorpay_order_id: razorpayOrder.id,
        razorpay_key_id: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        internalOrderId: internalOrderId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[ChiaGaming Order] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
