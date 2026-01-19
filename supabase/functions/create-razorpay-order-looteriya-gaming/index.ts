import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

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

// Currency minimums for validation
const CURRENCY_MINIMUMS: Record<string, { minText: number; minVoice: number; minHypersound: number; minMedia: number }> = {
  'INR': { minText: 40, minVoice: 150, minHypersound: 30, minMedia: 100 },
  'USD': { minText: 1, minVoice: 3, minHypersound: 1, minMedia: 2 },
  'EUR': { minText: 1, minVoice: 3, minHypersound: 1, minMedia: 2 },
  'GBP': { minText: 1, minVoice: 3, minHypersound: 1, minMedia: 2 },
  'AED': { minText: 4, minVoice: 12, minHypersound: 3, minMedia: 8 },
  'AUD': { minText: 2, minVoice: 5, minHypersound: 1.5, minMedia: 3 },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);
    console.log('[Looteriya Gaming] Payment request from IP:', clientIP);

    // Check rate limit (10 requests per minute)
    const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc('check_rate_limit_v2', {
      p_ip_address: clientIP,
      p_endpoint: 'create-razorpay-order-looteriya-gaming',
      p_max_requests: 10,
      p_window_seconds: 60
    });

    if (rateLimitError) {
      console.error('[Looteriya Gaming] Rate limit check error:', rateLimitError);
    }

    if (rateLimitOk === false) {
      console.log('[Looteriya Gaming] Rate limit exceeded for IP:', clientIP);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { name, amount, message, voiceMessageUrl, hypersoundUrl, mediaUrl, mediaType, currency = 'INR' } = await req.json();

    console.log('[Looteriya Gaming] Creating Razorpay order:', { name, amount, currency, hasVoice: !!voiceMessageUrl, hasHypersound: !!hypersoundUrl, hasMedia: !!mediaUrl });

    // Get minimums for currency
    const minimums = CURRENCY_MINIMUMS[currency] || CURRENCY_MINIMUMS['INR'];

    // Determine donation type and validate
    let donationType = 'text';
    let minAmount = minimums.minText;

    if (mediaUrl) {
      donationType = 'media';
      minAmount = minimums.minMedia;
    } else if (hypersoundUrl) {
      donationType = 'hypersound';
      minAmount = minimums.minHypersound;
    } else if (voiceMessageUrl) {
      donationType = 'voice';
      minAmount = minimums.minVoice;
    }

    // Validate input
    if (!name || !amount || parseFloat(amount) < minAmount) {
      throw new Error(`Invalid donation details. Minimum for ${donationType} is ${minAmount} ${currency}`);
    }

    // Get streamer info
    const { data: streamer } = await supabase
      .from('streamers')
      .select('id')
      .eq('streamer_slug', 'looteriya_gaming')
      .single();

    if (!streamer) {
      throw new Error('Streamer not found');
    }

    // Generate unique order ID with lg_rp_ prefix
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const orderId = `lg_rp_${timestamp}_${randomStr}`;

    // Create Razorpay order using direct fetch
    const razorpayKeyId = Deno.env.get('razorpay-keyid');
    const razorpayKeySecret = Deno.env.get('razorpay-keysecret');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    // Calculate amount in subunits
    const amountValue = parseFloat(amount);
    const amountInSubunits = Math.round(amountValue * 100);

    const razorpayAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInSubunits,
        currency: currency,
        receipt: orderId,
      }),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error('[Looteriya Gaming] Razorpay error:', errorText);
      throw new Error('Failed to create Razorpay order');
    }

    const razorpayOrder = await razorpayResponse.json();
    console.log('[Looteriya Gaming] Razorpay order created:', razorpayOrder.id);

    // Sanitize user inputs to prevent XSS attacks
    const sanitizedName = sanitizeName(name);
    const sanitizedMessage = sanitizeInput(message);

    if (!sanitizedName) {
      throw new Error('Invalid name provided');
    }

    // Store donation in database
    const { data: donation, error: dbError } = await supabase
      .from('looteriya_gaming_donations')
      .insert({
        name: sanitizedName,
        amount: amountValue,
        currency: currency,
        message: sanitizedMessage,
        voice_message_url: voiceMessageUrl || null,
        hypersound_url: hypersoundUrl || null,
        media_url: mediaUrl || null,
        media_type: mediaType || null,
        is_hyperemote: !!hypersoundUrl,
        payment_status: 'pending',
        moderation_status: 'pending',
        order_id: orderId,
        razorpay_order_id: razorpayOrder.id,
        streamer_id: streamer.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Looteriya Gaming] Database error:', dbError);
      throw new Error('Failed to store donation');
    }

    console.log('[Looteriya Gaming] Donation stored:', donation.id);

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
    console.error('[Looteriya Gaming] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
