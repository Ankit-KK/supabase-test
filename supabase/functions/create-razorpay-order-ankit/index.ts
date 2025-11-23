import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, amount, message, voiceMessageUrl, isHyperemote } = await req.json()

    console.log('Create Razorpay order request:', { name, amount, isHyperemote, hasVoice: !!voiceMessageUrl })

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

    // Validate minimum amounts based on donation type
    if (isHyperemote && amount < 50) {
      throw new Error('Hyperemotes require minimum ₹50')
    }

    if (voiceMessageUrl && amount < 150) {
      throw new Error('Voice messages require minimum ₹150')
    }

    if (!voiceMessageUrl && !isHyperemote && amount < 40) {
      throw new Error('Text messages require minimum ₹40')
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

    // Generate unique order ID with razorpay prefix
    const orderId = `ankit_razorpay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log('Creating Razorpay order:', { orderId, amount })

    // Create Razorpay order
    const razorpayPayload = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: orderId,
      description: 'Digital Interaction Service',
      notes: {
        product_type: 'digital_engagement',
        customer_name: name.substring(0, 50)
      }
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
      .from('ankit_donations')
      .insert({
        order_id: orderId,
        razorpay_order_id: razorpayOrder.id,
        name: name.trim(),
        amount: parseFloat(amount),
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
        amount: razorpayOrder.amount // Already in paise
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
