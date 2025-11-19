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
    const { name, amount, message, phone, voiceMessageUrl, isHyperemote } = await req.json()

    console.log('Creating THUNDERX payment order:', { name, amount, message, phone, isHyperemote })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get Cashfree credentials
    const xClientId = Deno.env.get('XClientId')!
    const xClientSecret = Deno.env.get('XClientSecret')!
    const apiUrl = Deno.env.get('api_url')!

    if (!xClientId || !xClientSecret || !apiUrl) {
      throw new Error('Cashfree credentials not configured')
    }

    // Get or create streamer record
    let { data: streamer, error: streamerError } = await supabaseClient
      .from('streamers')
      .select('*')
      .eq('streamer_slug', 'thunderx')
      .single()

    if (streamerError || !streamer) {
      const { data: newStreamer, error: createError } = await supabaseClient
        .from('streamers')
        .insert({
          streamer_slug: 'thunderx',
          streamer_name: 'THUNDERX',
          brand_color: '#10b981'
        })
        .select()
        .single()

      if (createError) throw createError
      streamer = newStreamer
    }

    // Validate input
    if (!name || !amount) {
      throw new Error('Name and amount are required')
    }

    if (!phone || phone.length !== 10) {
      throw new Error('Valid 10-digit phone number is required')
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error('Invalid amount')
    }

    // Validate minimum amounts based on donation type
    if (isHyperemote && amountNum < 50) {
      throw new Error('Minimum amount for hyperemotes is ₹50')
    }
    if (voiceMessageUrl && amountNum < 150) {
      throw new Error('Minimum amount for voice messages is ₹150')
    }
    if (message && !voiceMessageUrl && !isHyperemote && amountNum < 40) {
      throw new Error('Minimum amount for text messages is ₹40')
    }

    // Generate unique order ID
    const orderId = `thunderx_${Date.now()}_${Math.random().toString(36).substring(7)}`

    console.log('Generated order ID:', orderId)

    // Create Cashfree order
    const cashfreeOrderData = {
      order_id: orderId,
      order_amount: amountNum,
      order_currency: 'INR',
      customer_details: {
        customer_id: `customer_${Date.now()}`,
        customer_name: name,
        customer_phone: phone,
      },
      order_meta: {
        return_url: `${req.headers.get('origin')}/status?order_id=${orderId}&status={order_status}`,
        notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/cashfree-webhook`,
      },
    }

    console.log('Cashfree order data:', JSON.stringify(cashfreeOrderData, null, 2))

    // Call Cashfree API
    const cashfreeResponse = await fetch(`${apiUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': xClientId,
        'x-client-secret': xClientSecret,
      },
      body: JSON.stringify(cashfreeOrderData),
    })

    if (!cashfreeResponse.ok) {
      const errorText = await cashfreeResponse.text()
      console.error('Cashfree API error:', errorText)
      throw new Error(`Cashfree order creation failed: ${errorText}`)
    }

    const cashfreeOrder = await cashfreeResponse.json()
    console.log('Cashfree order created:', cashfreeOrder)

    // Determine moderation status
    let moderationStatus = 'pending'
    if (isHyperemote) {
      moderationStatus = 'auto_approved'
    } else if (voiceMessageUrl) {
      moderationStatus = 'auto_approved'
    } else if (amountNum >= 70) {
      moderationStatus = 'auto_approved'
    }

    // Store donation in database
    const { data: donation, error: donationError } = await supabaseClient
      .from('thunderx_donations')
      .insert({
        streamer_id: streamer.id,
        name,
        amount: amountNum,
        message: message || null,
        voice_message_url: voiceMessageUrl || null,
        order_id: orderId,
        payment_status: 'pending',
        moderation_status: moderationStatus,
        is_hyperemote: isHyperemote || false,
      })
      .select()
      .single()

    if (donationError) {
      console.error('Error storing donation:', donationError)
      throw donationError
    }

    console.log('Donation stored:', donation)

    return new Response(
      JSON.stringify({
        payment_session_id: cashfreeOrder.payment_session_id,
        order_id: orderId,
        cf_order_id: cashfreeOrder.order_id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in create-payment-order-thunderx:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})