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
      // Initialize Pusher for all events
      const pusherAppId = Deno.env.get('PUSHER_APP_ID')!
      const pusherKey = Deno.env.get('PUSHER_KEY')!
      const pusherSecret = Deno.env.get('PUSHER_SECRET')!
      const pusherCluster = Deno.env.get('PUSHER_CLUSTER')!
      const pusherUrl = `https://api-${pusherCluster}.pusher.com/apps/${pusherAppId}/events`

      // Helper function to send Pusher events
      const sendPusherEvent = async (channels: string[], eventName: string, data: any) => {
        const pusherPayload = {
          name: eventName,
          channels,
          data: JSON.stringify(data)
        }
        
        const timestamp = Math.floor(Date.now() / 1000)
        const pusherBody = JSON.stringify(pusherPayload)
        const bodyMd5 = createHash('md5').update(pusherBody).digest('hex')
        const authString = `POST\n/apps/${pusherAppId}/events\nauth_key=${pusherKey}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}`
        const authSignature = createHmac('sha256', pusherSecret).update(authString).digest('hex')
        const pusherUrlWithAuth = `${pusherUrl}?auth_key=${pusherKey}&auth_timestamp=${timestamp}&auth_version=1.0&auth_signature=${authSignature}&body_md5=${bodyMd5}`
        
        await fetch(pusherUrlWithAuth, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: pusherBody
        })
      }

      // Send new-donation event to alerts and dashboard channels
      await sendPusherEvent(['ankit-alerts', 'ankit-dashboard'], 'new-donation', {
        id: donation.id,
        name: donation.name,
        amount: donation.amount,
        message: donation.message,
        is_hyperemote: donation.is_hyperemote,
        voice_message_url: donation.voice_message_url,
        created_at: donation.created_at
      })

      console.log('Pusher events sent to alerts and dashboard')

      // Handle TTS generation and audio channel events based on donation type
      // 1. HYPEREMOTES - NO TTS, just visual effects
      if (donation.is_hyperemote) {
        console.log('Hyperemote donation - skipping TTS, visual alert only')
        // No audio channel event for hyperemotes
      }
      
      // 2. VOICE MESSAGES - Generate announcement TTS + play voice
      else if (donation.voice_message_url) {
        console.log('Voice message donation - generating announcement TTS')
        
        try {
          const { data: announcementTTS, error: announcementError } = await supabase.functions.invoke('generate-donation-tts', {
            body: {
              username: donation.name,
              amount: donation.amount,
              message: null,
              donationId: donation.id,
              streamerId: donation.streamer_id,
              isVoiceAnnouncement: true
            }
          })
          
          if (announcementError) {
            console.error('Announcement TTS generation error:', announcementError)
          } else if (announcementTTS?.audioUrl) {
            console.log('Announcement TTS generated successfully, sending to audio channel')
            
            // Send audio event with BOTH announcement TTS and voice URL
            await sendPusherEvent(['ankit-audio'], 'new-audio-message', {
              id: donation.id,
              name: donation.name,
              amount: donation.amount,
              message: null,
              announcement_tts_url: announcementTTS.audioUrl, // Play this first
              voice_message_url: donation.voice_message_url, // Then play this
              tts_audio_url: null,
              created_at: donation.created_at
            })
            
            console.log('✅ Voice message with announcement sent to ankit-audio')
          }
        } catch (error) {
          console.error('Voice message announcement error:', error)
        }
      }
      
      // 3. TEXT MESSAGES - Conditional TTS based on amount
      else if (donation.message) {
        // ₹40-69: Display only, NO TTS
        if (donation.amount >= 40 && donation.amount < 70) {
          console.log('Text donation ₹40-69 - displaying without TTS')
          // Alert already sent to dashboard, no audio event needed
        }
        
        // ₹70+: Display + Generate TTS
        else if (donation.amount >= 70) {
          console.log('Text donation ₹70+ - generating TTS')
          
          try {
            const { data: ttsData, error: ttsError } = await supabase.functions.invoke('generate-donation-tts', {
              body: {
                username: donation.name,
                amount: donation.amount,
                message: donation.message,
                donationId: donation.id,
                streamerId: donation.streamer_id,
                isVoiceAnnouncement: false
              }
            })
            
            if (ttsError) {
              console.error('TTS generation error:', ttsError)
            } else if (ttsData?.audioUrl) {
              console.log('TTS generated successfully, sending to audio channel')
              
              // Send audio event with TTS URL
              await sendPusherEvent(['ankit-audio'], 'new-audio-message', {
                id: donation.id,
                name: donation.name,
                amount: donation.amount,
                message: donation.message,
                announcement_tts_url: null,
                voice_message_url: null,
                tts_audio_url: ttsData.audioUrl,
                created_at: donation.created_at
              })
              
              console.log('✅ Text message with TTS sent to ankit-audio')
            }
          } catch (error) {
            console.error('Text TTS generation error:', error)
          }
        }
      }
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

