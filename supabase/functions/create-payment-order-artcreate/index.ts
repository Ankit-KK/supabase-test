import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, amount, message, voiceData } = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Cashfree credentials
    const xClientId = Deno.env.get('XClientId')!
    const xClientSecret = Deno.env.get('XClientSecret')!
    const apiUrl = Deno.env.get('api_url')!

    // Validate input
    if (!name || !amount) {
      throw new Error('Missing required fields: name, amount')
    }

    if (amount < 1 || amount > 100000) {
      throw new Error('Invalid amount: must be between 1 and 100000')
    }

    // Get streamer info for ArtCreate
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('id')
      .eq('streamer_slug', 'artcreate')
      .single()

    if (streamerError || !streamerData) {
      // Create ArtCreate streamer if doesn't exist
      const { data: newStreamer, error: createError } = await supabase
        .from('streamers')
        .insert({
          streamer_slug: 'artcreate',
          streamer_name: 'ArtCreate',
          brand_color: '#8b5cf6',
          hyperemotes_enabled: true,
          hyperemotes_min_amount: 50
        })
        .select()
        .single()

      if (createError) {
        throw new Error('Failed to create streamer')
      }
      streamerData = newStreamer
    }

    // Generate unique order ID
    const orderId = `artcreate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create Cashfree payment order
    const cashfreePayload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: `customer_${Date.now()}`,
        customer_name: name
      },
      order_meta: {
        return_url: `${req.headers.get('origin')}/artcreate?order_id=${orderId}&status={order_status}`,
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

    // Store donation in database (using chia_gaming_donations table structure)
    const { data: donation, error: donationError } = await supabase
      .from('chia_gaming_donations')
      .insert({
        id: orderId,
        name: name.trim(),
        amount: parseFloat(amount),
        message: message ? message.trim() : null,
        streamer_id: streamerData.id,
        payment_status: 'pending',
        moderation_status: 'pending',
        temp_voice_data: voiceData || null,
        is_hyperemote: parseFloat(amount) >= 50
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
        cashfree_order_id: cashfreeOrder.cf_order_id,
        payment_url: cashfreeOrder.payment_link
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
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})