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
    const { name, amount, message, phone, voiceData, isHyperemote } = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Cashfree credentials
    const xClientId = Deno.env.get('XClientId')!
    const xClientSecret = Deno.env.get('XClientSecret')!
    const apiUrl = Deno.env.get('api_url')!

    // Validate input
    if (!name || !amount || !phone) {
      throw new Error('Missing required fields: name, amount, phone')
    }

    if (amount < 1 || amount > 100000) {
      throw new Error('Invalid amount: must be between 1 and 100000')
    }

    // Get streamer info including hyperemote settings
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('id, hyperemotes_enabled, hyperemotes_min_amount')
      .eq('streamer_slug', 'yogatime')
      .single()

    if (streamerError || !streamerData) {
      throw new Error('Streamer not found')
    }

    // Generate unique order ID
    const orderId = `yogatime_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create Cashfree payment order
    const cashfreePayload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: `customer_${Date.now()}`,
        customer_name: name,
        customer_phone: phone
      },
      order_meta: {
        return_url: `${req.headers.get('origin')}/yogatime?order_id=${orderId}&status={order_status}`,
        notify_url: `${supabaseUrl}/functions/v1/cashfree-webhook`
      }
    }

    const cashfreeResponse = await fetch(`${apiUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': xClientId,
        'x-client-secret': xClientSecret,
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify(cashfreePayload)
    })

    if (!cashfreeResponse.ok) {
      const errorData = await cashfreeResponse.text()
      console.error('Cashfree API error:', errorData)
      throw new Error('Failed to create payment order')
    }

    const cashfreeOrder = await cashfreeResponse.json()

    // Only set hyperemote if explicitly requested by user
    const isHyperemoteValue = isHyperemote === true
    
    // Store donation in database
    const { data: donation, error: donationError } = await supabase
      .from('yogatime_donations')
      .insert({
        order_id: orderId,
        name: name.trim(),
        amount: parseFloat(amount),
        message: message ? message.trim() : null,
        streamer_id: streamerData.id,
        payment_status: 'pending',
        moderation_status: 'pending',
        is_hyperemote: isHyperemoteValue,
        temp_voice_data: voiceData || null
      })
      .select()
      .single()

    if (donationError) {
      console.error('Database error:', donationError)
      throw new Error('Failed to store donation')
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderId,
        payment_session_id: cashfreeOrder.payment_session_id,
        order_token: cashfreeOrder.order_token,
        cashfree_order_id: cashfreeOrder.cf_order_id
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