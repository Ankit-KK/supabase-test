import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

const CURRENCY_MINIMUMS: Record<string, { text: number; voice: number; hypersound: number }> = {
  'INR': { text: 40, voice: 150, hypersound: 30 },
  'USD': { text: 1, voice: 3, hypersound: 1 },
  'EUR': { text: 1, voice: 3, hypersound: 1 },
  'GBP': { text: 1, voice: 3, hypersound: 1 },
  'AED': { text: 4, voice: 12, hypersound: 3 },
  'AUD': { text: 2, voice: 5, hypersound: 1.5 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);
    console.log('[Jhanvoo] Payment request from IP:', clientIP);

    // Check rate limit (10 requests per minute)
    const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc('check_rate_limit_v2', {
      p_ip_address: clientIP,
      p_endpoint: 'create-razorpay-order-jhanvoo',
      p_max_requests: 10,
      p_window_seconds: 60
    });

    if (rateLimitError) {
      console.error('[Jhanvoo] Rate limit check error:', rateLimitError);
    }

    if (rateLimitOk === false) {
      console.log('[Jhanvoo] Rate limit exceeded for IP:', clientIP);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { name, amount, currency = 'INR', message, voiceMessageUrl, hypersoundUrl } = await req.json();

    console.log('[Jhanvoo] Creating order:', { name, amount, currency });

    const mins = CURRENCY_MINIMUMS[currency] || CURRENCY_MINIMUMS['INR'];

    // Validate minimum amounts based on type
    if (hypersoundUrl && amount < mins.hypersound) {
      return new Response(
        JSON.stringify({ error: `Minimum ${currency} ${mins.hypersound} required for HyperSounds` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (voiceMessageUrl && amount < mins.voice) {
      return new Response(
        JSON.stringify({ error: `Minimum ${currency} ${mins.voice} required for voice messages` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!voiceMessageUrl && !hypersoundUrl && amount < mins.text) {
      return new Response(
        JSON.stringify({ error: `Minimum ${currency} ${mins.text} required for text messages` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Razorpay credentials
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('[Jhanvoo] Missing Razorpay credentials');
      return new Response(
        JSON.stringify({ error: 'Payment gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get streamer ID
    const { data: streamer, error: streamerError } = await supabase
      .from('streamers')
      .select('id')
      .eq('streamer_slug', 'jhanvoo')
      .single();

    if (streamerError || !streamer) {
      console.error('[Jhanvoo] Streamer not found:', streamerError);
      return new Response(
        JSON.stringify({ error: 'Streamer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate internal order ID
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const orderId = `jv_rp_${timestamp}_${randomStr}`;

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
        receipt: orderId,
      }),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error('[Jhanvoo] Razorpay order creation failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const razorpayOrder = await razorpayResponse.json();
    console.log('[Jhanvoo] Razorpay order created:', razorpayOrder.id);

    // Sanitize user inputs to prevent XSS attacks
    const sanitizedName = sanitizeName(name);
    const sanitizedMessage = sanitizeInput(message);

    if (!sanitizedName) {
      throw new Error('Invalid name provided');
    }

    // Insert donation record
    const { error: insertError } = await supabase
      .from('jhanvoo_donations')
      .insert({
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
        streamer_id: streamer.id,
      });

    if (insertError) {
      console.error('[Jhanvoo] Database insert failed:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create donation record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Jhanvoo] Order created successfully:', orderId);

    return new Response(
      JSON.stringify({
        orderId,
        razorpay_order_id: razorpayOrder.id,
        razorpay_key_id: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        internalOrderId: orderId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Jhanvoo] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
