import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Currency minimums (matching frontend)
const CURRENCY_MINIMUMS: Record<string, { minText: number; minVoice: number; minHypersound: number }> = {
  'INR': { minText: 40, minVoice: 150, minHypersound: 30 },
  'USD': { minText: 1, minVoice: 3, minHypersound: 1 },
  'EUR': { minText: 1, minVoice: 3, minHypersound: 1 },
  'GBP': { minText: 1, minVoice: 3, minHypersound: 1 },
  'AED': { minText: 4, minVoice: 12, minHypersound: 3 },
  'AUD': { minText: 2, minVoice: 5, minHypersound: 1.5 },
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, amount, message, voiceMessageUrl, hypersoundUrl, currency = 'INR' } = await req.json()

    console.log('Create Razorpay order request:', { name, amount, currency, hasVoice: !!voiceMessageUrl, hasHypersound: !!hypersoundUrl })

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

    if (amount < 1 || amount > 100000) {
      throw new Error('Invalid amount: must be between 1 and 100000')
    }

    // Get currency minimums (default to INR if unknown)
    const currencyMins = CURRENCY_MINIMUMS[currency] || CURRENCY_MINIMUMS['INR']

    // Validate minimum amounts based on donation type
    if (hypersoundUrl && amount < currencyMins.minHypersound) {
      throw new Error(`HyperSounds require minimum ${currency} ${currencyMins.minHypersound}`)
    }

    if (voiceMessageUrl && amount < currencyMins.minVoice) {
      throw new Error(`Voice messages require minimum ${currency} ${currencyMins.minVoice}`)
    }

    if (!voiceMessageUrl && !hypersoundUrl && amount < currencyMins.minText) {
      throw new Error(`Text messages require minimum ${currency} ${currencyMins.minText}`)
    }

    // Get streamer info
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('id')
      .eq('streamer_slug', 'jimmy_gaming')
      .single()

    if (streamerError || !streamerData) {
      throw new Error('Streamer not found')
    }

    // Generate unique order ID with short razorpay prefix (max 40 chars for Razorpay receipt)
    const orderId = `jg_rp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    console.log('Creating Razorpay order:', { orderId, amount, currency })

    // Convert amount to subunits based on currency
    const amountInSubunits = Math.round(amount * 100)

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

    // Store donation in database
    const { data: donation, error: donationError } = await supabase
      .from('jimmy_gaming_donations')
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
        is_hyperemote: !!hypersoundUrl,
        hypersound_url: hypersoundUrl || null,
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
        amount: razorpayOrder.amount
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
