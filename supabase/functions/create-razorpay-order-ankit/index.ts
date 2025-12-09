import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Currency exponents for Razorpay
const CURRENCY_EXPONENTS: Record<string, number> = {
  'BHD': 3, 'KWD': 3, 'OMR': 3, 'JOD': 3, 'TND': 3, 'IQD': 3, 'LYD': 3,
  'JPY': 0, 'KRW': 0, 'VND': 0, 'CLP': 0, 'ISK': 0, 'PYG': 0, 'RWF': 0,
  'VUV': 0, 'XAF': 0, 'XOF': 0, 'XPF': 0, 'UGX': 0, 'BIF': 0, 'DJF': 0,
  'GNF': 0, 'KMF': 0,
}

// Supported currencies with minimums
const CURRENCY_MINIMUMS: Record<string, { minText: number; minVoice: number; minHyperemote: number; symbol: string }> = {
  'INR': { minText: 40, minVoice: 150, minHyperemote: 50, symbol: '₹' },
  'USD': { minText: 1, minVoice: 3, minHyperemote: 1, symbol: '$' },
  'EUR': { minText: 1, minVoice: 3, minHyperemote: 1, symbol: '€' },
  'GBP': { minText: 1, minVoice: 3, minHyperemote: 1, symbol: '£' },
  'AED': { minText: 4, minVoice: 12, minHyperemote: 4, symbol: 'د.إ' },
  'AUD': { minText: 2, minVoice: 5, minHyperemote: 2, symbol: 'A$' },
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
    const { name, amount, message, voiceMessageUrl, isHyperemote, currency = 'INR' } = await req.json()

    console.log('Create Razorpay order request:', { name, amount, currency, isHyperemote, hasVoice: !!voiceMessageUrl })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
    if (isHyperemote && amount < currencyMins.minHyperemote) {
      throw new Error(`Hyperemotes require minimum ${symbol}${currencyMins.minHyperemote}`)
    }

    if (voiceMessageUrl && amount < currencyMins.minVoice) {
      throw new Error(`Voice messages require minimum ${symbol}${currencyMins.minVoice}`)
    }

    if (!voiceMessageUrl && !isHyperemote && amount < currencyMins.minText) {
      throw new Error(`Text messages require minimum ${symbol}${currencyMins.minText}`)
    }

    // Get streamer info
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('id, hyperemotes_enabled, hyperemotes_min_amount')
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

    // Store donation in database with currency
    const { data: donation, error: donationError } = await supabase
      .from('ankit_donations')
      .insert({
        order_id: orderId,
        razorpay_order_id: razorpayOrder.id,
        name: name.trim(),
        amount: parseFloat(amount),
        currency: currency,
        message: message ? message.trim() : null,
        streamer_id: streamerData.id,
        payment_status: 'pending',
        moderation_status: 'pending',
        is_hyperemote: isHyperemote || false,
        voice_message_url: voiceMessageUrl || null
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
