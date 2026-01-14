import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

// Currency exponents for Razorpay
const CURRENCY_EXPONENTS: Record<string, number> = {
  'BHD': 3, 'KWD': 3, 'OMR': 3, 'JOD': 3, 'TND': 3, 'IQD': 3, 'LYD': 3,
  'JPY': 0, 'KRW': 0, 'VND': 0, 'CLP': 0, 'ISK': 0, 'PYG': 0, 'RWF': 0,
  'VUV': 0, 'XAF': 0, 'XOF': 0, 'XPF': 0, 'UGX': 0, 'BIF': 0, 'DJF': 0,
  'GNF': 0, 'KMF': 0,
}

// Supported currencies with minimums (minHypersound replaces minHyperemote)
const CURRENCY_MINIMUMS: Record<string, { minText: number; minVoice: number; minHypersound: number; symbol: string }> = {
  'INR': { minText: 40, minVoice: 150, minHypersound: 30, symbol: '₹' },
  'USD': { minText: 1, minVoice: 3, minHypersound: 1, symbol: '$' },
  'EUR': { minText: 1, minVoice: 3, minHypersound: 1, symbol: '€' },
  'GBP': { minText: 1, minVoice: 3, minHypersound: 1, symbol: '£' },
  'AED': { minText: 4, minVoice: 12, minHypersound: 3, symbol: 'د.إ' },
  'AUD': { minText: 2, minVoice: 5, minHypersound: 1.5, symbol: 'A$' },
}

const getExponent = (currencyCode: string): number => 
  CURRENCY_EXPONENTS[currencyCode] ?? 2

const amountToSubunits = (amount: number, currencyCode: string): number => {
  const exponent = getExponent(currencyCode)
  
  if (exponent === 0) {
    return Math.round(amount)
  } else if (exponent === 3) {
    const subunits = Math.round(amount * 1000)
    return Math.floor(subunits / 10) * 10
  } else {
    return Math.round(amount * 100)
  }
}

const getCurrencyMinimums = (currencyCode: string) => {
  return CURRENCY_MINIMUMS[currencyCode] || CURRENCY_MINIMUMS['INR']
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get client IP for rate limiting
    const clientIP = getClientIP(req)
    console.log('Payment request from IP:', clientIP)

    // Check rate limit (10 requests per minute)
    const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc('check_rate_limit_v2', {
      p_ip_address: clientIP,
      p_endpoint: 'create-razorpay-order-ankit',
      p_max_requests: 10,
      p_window_seconds: 60
    })

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError)
    }

    if (rateLimitOk === false) {
      console.log('Rate limit exceeded for IP:', clientIP)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Too many requests. Please try again later.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { name, amount, message, voiceMessageUrl, hypersoundUrl, currency = 'INR' } = await req.json()

    console.log('Create Razorpay order request:', { name, amount, currency, hasVoice: !!voiceMessageUrl, hasHypersound: !!hypersoundUrl })

    // Get Razorpay credentials
    const razorpayKeyId = Deno.env.get('razorpay-keyid')!
    const razorpayKeySecret = Deno.env.get('razorpay-keysecret')!

    // Validate input
    if (!name || !amount) {
      throw new Error('Missing required fields: name, amount')
    }

    // Validate currency is supported
    if (!CURRENCY_MINIMUMS[currency]) {
      throw new Error(`Unsupported currency: ${currency}. Supported: INR, USD, EUR, GBP, AED, AUD`)
    }

    if (amount < 1 || amount > 100000) {
      throw new Error('Invalid amount: must be between 1 and 100000')
    }

    // Get currency-specific minimums
    const currencyMins = getCurrencyMinimums(currency)
    const symbol = currencyMins.symbol

    // Validate minimum amounts based on donation type and currency
    if (hypersoundUrl && amount < currencyMins.minHypersound) {
      throw new Error(`HyperSounds require minimum ${symbol}${currencyMins.minHypersound}`)
    }

    if (voiceMessageUrl && amount < currencyMins.minVoice) {
      throw new Error(`Voice messages require minimum ${symbol}${currencyMins.minVoice}`)
    }

    if (!voiceMessageUrl && !hypersoundUrl && amount < currencyMins.minText) {
      throw new Error(`Text messages require minimum ${symbol}${currencyMins.minText}`)
    }

    // Get streamer info
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('id')
      .eq('streamer_slug', 'ankit')
      .single()

    if (streamerError || !streamerData) {
      throw new Error('Streamer not found')
    }

    // Generate unique order ID with short razorpay prefix (max 40 chars for Razorpay receipt)
    const orderId = `ak_rp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    // Convert amount to subunits based on currency
    const amountInSubunits = amountToSubunits(amount, currency)

    console.log('Creating Razorpay order:', { orderId, amount, currency, amountInSubunits })

    // Create Razorpay order
    const razorpayPayload = {
      amount: amountInSubunits,
      currency: currency,
      receipt: orderId
    }

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
      },
      body: JSON.stringify(razorpayPayload)
    })

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text()
      console.error('Razorpay API error:', errorData)
      throw new Error('Failed to create Razorpay order')
    }

    const razorpayOrder = await razorpayResponse.json()
    console.log('Razorpay order created:', razorpayOrder.id)

    // Sanitize user inputs to prevent XSS attacks
    const sanitizedName = sanitizeName(name);
    const sanitizedMessage = sanitizeInput(message);

    if (!sanitizedName) {
      throw new Error('Invalid name provided');
    }

    // Store donation in database with currency
    // Note: is_hyperemote is set to true for hypersounds to trigger visual effects
    const { data: donation, error: donationError } = await supabase
      .from('ankit_donations')
      .insert({
        order_id: orderId,
        razorpay_order_id: razorpayOrder.id,
        name: sanitizedName,
        amount: parseFloat(amount),
        currency: currency,
        message: sanitizedMessage,
        streamer_id: streamerData.id,
        payment_status: 'pending',
        moderation_status: 'pending',
        is_hyperemote: !!hypersoundUrl, // Still use this flag for visual effects
        voice_message_url: voiceMessageUrl || null,
        hypersound_url: hypersoundUrl || null
      })
      .select()
      .single()

    if (donationError) {
      console.error('Database error:', donationError)
      throw new Error('Failed to store donation')
    }

    console.log('Donation stored:', donation.id)

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderId,
        razorpay_order_id: razorpayOrder.id,
        razorpay_key_id: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: currency
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
