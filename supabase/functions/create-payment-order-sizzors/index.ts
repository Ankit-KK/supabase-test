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

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Cashfree credentials
    const xClientId = Deno.env.get('XClientId')
    const xClientSecret = Deno.env.get('XClientSecret')
    const apiUrl = Deno.env.get('api_url')

    if (!xClientId || !xClientSecret || !apiUrl) {
      throw new Error('Cashfree credentials not configured')
    }

    // Validate inputs
    if (!name || !amount || !phone) {
      throw new Error('Name, amount, and phone are required')
    }

    if (amount < 1 || amount > 100000) {
      throw new Error('Amount must be between ₹1 and ₹100,000')
    }

    // Get streamer info including hyperemote settings
    const { data: streamerData, error: streamerError } = await supabaseClient
      .from('streamers')
      .select('id, hyperemotes_enabled, hyperemotes_min_amount')
      .eq('streamer_slug', 'sizzors')
      .single()

    if (streamerError || !streamerData) {
      throw new Error('Streamer not found')
    }

    // Generate unique order ID
    const orderId = `sizzors_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create payment order with Cashfree
    const cashfreePayload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: `customer_${Date.now()}`,
        customer_name: name,
        customer_phone: phone,
      },
      order_meta: {
        return_url: `${req.headers.get('origin')}/sizzors?order_id=${orderId}`,
        notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/cashfree-webhook`,
      },
    }

    const cashfreeResponse = await fetch(`${apiUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': xClientId,
        'x-client-secret': xClientSecret,
      },
      body: JSON.stringify(cashfreePayload),
    })

    if (!cashfreeResponse.ok) {
      const errorText = await cashfreeResponse.text()
      console.error('Cashfree API error:', errorText)
      throw new Error('Payment order creation failed')
    }

    const cashfreeData = await cashfreeResponse.json()

    // Only set hyperemote if explicitly requested by user
    const isHyperemoteValue = isHyperemote === true;

    // Store donation in database
    const { error: insertError } = await supabaseClient
      .from('sizzors_donations')
      .insert({
        order_id: orderId,
        streamer_id: streamerData.id,
        name: name,
        amount: amount,
        message: message || null,
        voice_message_url: voiceMessageUrl || null,
        payment_status: 'pending',
        moderation_status: isHyperemoteValue ? 'auto_approved' : 'pending',
        is_hyperemote: isHyperemoteValue,
      })

    if (insertError) {
      console.error('Database insert error:', insertError)
      throw new Error('Failed to save donation')
    }

    return new Response(
      JSON.stringify({
        payment_session_id: cashfreeData.payment_session_id,
        order_id: orderId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in create-payment-order-sizzors:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})