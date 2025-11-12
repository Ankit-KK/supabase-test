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

    console.log('Creating Looteriya Gaming payment order:', { name, amount, message, phone, isHyperemote })

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get Cashfree credentials (using the same env vars as other functions)
    const xClientId = Deno.env.get('XClientId')!
    const xClientSecret = Deno.env.get('XClientSecret')!
    const apiUrl = Deno.env.get('api_url')!

    if (!xClientId || !xClientSecret || !apiUrl) {
      throw new Error('Cashfree credentials not configured')
    }

    // Get or create streamer record for Looteriya Gaming
    let { data: streamer, error: streamerError } = await supabaseClient
      .from('streamers')
      .select('*')
      .eq('streamer_slug', 'looteriya_gaming')
      .single()

    if (streamerError || !streamer) {
      // Create streamer record if it doesn't exist
      const { data: newStreamer, error: createError } = await supabaseClient
        .from('streamers')
        .insert({
          streamer_slug: 'looteriya_gaming',
          streamer_name: 'Looteriya Gaming',
          brand_color: '#f59e0b'
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

    // Generate unique order ID
    const orderId = `looteriya_gaming_${Date.now()}_${Math.random().toString(36).substring(7)}`

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
        return_url: `https://${req.headers.get('host')}/looteriya_gaming?order_id=${orderId}&status={order_status}`,
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
      throw new Error(`Cashfree API error: ${errorText}`)
    }

    const cashfreeData = await cashfreeResponse.json()
    console.log('Cashfree order created successfully:', cashfreeData)

    // Store donation in database
    const { data: donation, error: donationError } = await supabaseClient
      .from('looteriya_gaming_donations')
      .insert({
        streamer_id: streamer.id,
        name,
        amount: amountNum,
        message,
        order_id: orderId,
        payment_status: 'pending',
        moderation_status: 'pending',
        voice_message_url: voiceMessageUrl || null,
        is_hyperemote: isHyperemote || false,
      })
      .select()
      .single()

    if (donationError) {
      console.error('Database insert error:', donationError)
      throw new Error('Failed to create donation record')
    }

    console.log('Donation record created:', donation)

    return new Response(
      JSON.stringify({
        success: true,
        payment_session_id: cashfreeData.payment_session_id,
        order_token: cashfreeData.order_token,
        order_id: orderId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in create-payment-order-looteriya-gaming:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
