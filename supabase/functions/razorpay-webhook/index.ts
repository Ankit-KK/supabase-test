import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash, createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const webhookSecret = Deno.env.get('razorpay-webhook-secret')
    const webhookSignature = req.headers.get('x-razorpay-signature')
    const webhookBody = await req.text()

    console.log('Razorpay webhook received')

    // Verify webhook signature if secret is configured
    if (webhookSecret && webhookSignature) {
      const expectedSignature = createHmac('sha256', webhookSecret)
        .update(webhookBody)
        .digest('hex')

      if (webhookSignature !== expectedSignature) {
        console.error('Invalid webhook signature')
        return new Response('Invalid signature', { status: 400, headers: corsHeaders })
      }
      console.log('Webhook signature verified ✓')
    } else if (!webhookSecret) {
      console.warn('⚠️ Webhook secret not configured - skipping signature verification (less secure)')
    } else if (!webhookSignature) {
      console.warn('⚠️ No signature in webhook - skipping verification')
    }

    // Parse webhook data
    const webhookData = JSON.parse(webhookBody)
    const event = webhookData.event
    
    console.log('Webhook event:', event)

    // Only process payment.captured and payment.failed events
    if (event !== 'payment.captured' && event !== 'payment.failed') {
      console.log('Ignoring event:', event)
      return new Response('Event ignored', { status: 200, headers: corsHeaders })
    }

    // Extract Razorpay order ID from payment entity
    const razorpayOrderId = webhookData.payload?.payment?.entity?.order_id
    
    console.log('Razorpay Order ID:', razorpayOrderId)
    
    if (!razorpayOrderId) {
      console.log('No Razorpay order ID found, ignoring')
      return new Response('No order ID', { status: 400, headers: corsHeaders })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get donation from database using Razorpay order ID
    const { data: donation, error: fetchError } = await supabase
      .from('ankit_donations')
      .select('*')
      .eq('razorpay_order_id', razorpayOrderId)
      .single()

    if (fetchError || !donation) {
      console.error('Donation not found for Razorpay order:', razorpayOrderId)
      return new Response('Donation not found', { status: 404, headers: corsHeaders })
    }
    
    console.log('Found donation:', donation.order_id)

    // Check if already processed
    if (donation.payment_status === 'success') {
      console.log('Payment already processed:', orderId)
      return new Response('Already processed', { status: 200, headers: corsHeaders })
    }

    const isSuccess = event === 'payment.captured'
    const newStatus = isSuccess ? 'success' : 'failed'

    console.log('Updating payment status to:', newStatus)

    // Update donation status
    const updateData: any = {
      payment_status: newStatus,
      updated_at: new Date().toISOString()
    }

    // Note: moderation_status is handled by database trigger
    // All donations are auto-approved by auto_approve_ankit_hyperemotes_iu()

    const { error: updateError } = await supabase
      .from('ankit_donations')
      .update(updateData)
      .eq('razorpay_order_id', razorpayOrderId)

    if (updateError) {
      console.error('Failed to update donation:', updateError)
      throw updateError
    }

    console.log('Donation updated successfully')

    // Only trigger events and TTS for successful payments
    if (isSuccess) {
      // Generate TTS FIRST based on donation type
      // Hyperemotes: NO TTS
      // Voice messages: Generate announcement TTS
      // Text messages ₹70+: Generate TTS
      if (!donation.is_hyperemote) {
        let shouldGenerateTTS = false
        let isVoiceAnnouncement = false

        if (donation.voice_message_url) {
          // Voice message - generate announcement
          shouldGenerateTTS = true
          isVoiceAnnouncement = true
        } else if (donation.amount >= 70 && donation.message) {
          // Text message with ₹70+
          shouldGenerateTTS = true
          isVoiceAnnouncement = false
        }

        if (shouldGenerateTTS) {
          console.log('Generating TTS:', { isVoiceAnnouncement, amount: donation.amount })
          
          await supabase.functions.invoke('generate-donation-tts', {
            body: {
              username: donation.name,
              amount: donation.amount,
              message: donation.message,
              donationId: donation.id,
              streamerId: donation.streamer_id,
              isVoiceAnnouncement: isVoiceAnnouncement
            }
          })

          console.log('TTS generation completed')
        }
      }

      // Refetch donation to get updated tts_audio_url
      const { data: updatedDonation } = await supabase
        .from('ankit_donations')
        .select('*')
        .eq('id', donation.id)
        .single()

      const finalDonation = updatedDonation || donation

      // Initialize Pusher
      const pusherAppId = Deno.env.get('PUSHER_APP_ID')!
      const pusherKey = Deno.env.get('PUSHER_KEY')!
      const pusherSecret = Deno.env.get('PUSHER_SECRET')!
      const pusherCluster = Deno.env.get('PUSHER_CLUSTER')!

      const pusherUrl = `https://api-${pusherCluster}.pusher.com/apps/${pusherAppId}/events`

      // Trigger Pusher events for OBS alerts, dashboard, and audio player with TTS URL
      const pusherPayload = {
        name: 'new-donation',
        channels: ['ankit-alerts', 'ankit-dashboard', 'ankit-audio'],
        data: JSON.stringify({
          id: finalDonation.id,
          name: finalDonation.name,
          amount: finalDonation.amount,
          message: finalDonation.message,
          is_hyperemote: finalDonation.is_hyperemote,
          voice_message_url: finalDonation.voice_message_url,
          tts_audio_url: finalDonation.tts_audio_url,
          created_at: finalDonation.created_at
        })
      }

      const timestamp = Math.floor(Date.now() / 1000)
      const pusherBody = JSON.stringify(pusherPayload)
      
      // Calculate body MD5 using Node.js crypto
      const bodyMd5 = createHash('md5').update(pusherBody).digest('hex')
      
      // Calculate HMAC signature for Pusher authentication
      const authString = `POST\n/apps/${pusherAppId}/events\nauth_key=${pusherKey}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}`
      const authSignature = createHmac('sha256', pusherSecret).update(authString).digest('hex')
      
      // Send request with auth params in query string
      const pusherUrlWithAuth = `${pusherUrl}?auth_key=${pusherKey}&auth_timestamp=${timestamp}&auth_version=1.0&auth_signature=${authSignature}&body_md5=${bodyMd5}`

      await fetch(pusherUrlWithAuth, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: pusherBody
      })

      console.log('Pusher events triggered with TTS URL')
    }

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

