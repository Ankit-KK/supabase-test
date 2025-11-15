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
    const { name, amount, message, phone, voiceMessageUrl, isHyperemote, selectedGifId } = await req.json()

    console.log('Creating Neko XENPAI payment order:', { name, amount, message, phone, isHyperemote, selectedGifId })

    // Initialize Supabase client with service role
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

    // Get or create streamer record for Neko XENPAI
    let { data: streamer, error: streamerError } = await supabaseClient
      .from('streamers')
      .select('*')
      .eq('streamer_slug', 'neko_xenpai')
      .single()

    if (streamerError || !streamer) {
      // Create streamer record if it doesn't exist
      const { data: newStreamer, error: createError } = await supabaseClient
        .from('streamers')
        .insert({
          streamer_slug: 'neko_xenpai',
          streamer_name: 'Neko XENPAI',
          brand_color: '#d946ef'
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
    const orderId = `neko_xenpai_${Date.now()}_${Math.random().toString(36).substring(7)}`

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
      throw new Error(`Failed to create Cashfree order: ${errorText}`)
    }

    const cashfreeOrder = await cashfreeResponse.json()
    console.log('Cashfree order created:', cashfreeOrder)

    // Store order in database
    const donationData: any = {
      streamer_id: streamer.id,
      name,
      amount: amountNum,
      message: message || null,
      order_id: orderId,
      payment_status: 'pending',
      moderation_status: isHyperemote ? 'auto_approved' : 'pending',
      is_hyperemote: isHyperemote || false,
      selected_gif_id: selectedGifId || null,
    }

    // Handle voice message if present
    if (voiceMessageUrl) {
      // Store voice message URL directly if already a public URL
      if (voiceMessageUrl.startsWith('http')) {
        donationData.voice_message_url = voiceMessageUrl
      } else {
        // It's base64 data - store temporarily
        donationData.temp_voice_data = voiceMessageUrl
      }
    }

    const { data: donation, error: donationError } = await supabaseClient
      .from('neko_xenpai_donations')
      .insert(donationData)
      .select()
      .single()

    if (donationError) {
      console.error('Failed to store donation:', donationError)
      throw new Error('Failed to store donation in database')
    }

    console.log('Donation stored:', donation)

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderId,
        payment_session_id: cashfreeOrder.payment_session_id,
        order_details: cashfreeOrder,
        donation_id: donation.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Error in create-payment-order-neko-xenpai:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        details: error.toString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
