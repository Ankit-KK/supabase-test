import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { crypto as stdCrypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pusher credentials by group
const PUSHER_CREDENTIALS: Record<number, { appId: string; key: string; secret: string; cluster: string }> = {
  1: {
    appId: Deno.env.get('PUSHER_APP_ID') || '',
    key: Deno.env.get('PUSHER_KEY') || '',
    secret: Deno.env.get('PUSHER_SECRET') || '',
    cluster: Deno.env.get('PUSHER_CLUSTER') || 'ap2',
  },
  2: {
    appId: Deno.env.get('PUSHER_APP_ID_2') || '',
    key: Deno.env.get('PUSHER_KEY_2') || '',
    secret: Deno.env.get('PUSHER_SECRET_2') || '',
    cluster: Deno.env.get('PUSHER_CLUSTER_2') || 'ap2',
  },
  3: {
    appId: Deno.env.get('PUSHER_APP_ID_3') || '',
    key: Deno.env.get('PUSHER_KEY_3') || '',
    secret: Deno.env.get('PUSHER_SECRET_3') || '',
    cluster: Deno.env.get('PUSHER_CLUSTER_3') || 'ap2',
  },
};

async function generatePusherSignature(stringToSign: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(stringToSign);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sendPusherEvent(channels: string[], event: string, data: any, pusherGroup: number = 1): Promise<boolean> {
  try {
    const creds = PUSHER_CREDENTIALS[pusherGroup] || PUSHER_CREDENTIALS[1];
    
    if (!creds.appId || !creds.key || !creds.secret) {
      console.error('[Looteriya Gaming] Missing Pusher credentials for group:', pusherGroup);
      return false;
    }

    const body = JSON.stringify({ name: event, channels, data: JSON.stringify(data) });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const md5Hash = Array.from(new Uint8Array(await stdCrypto.subtle.digest('MD5', new TextEncoder().encode(body))))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    const stringToSign = `POST\n/apps/${creds.appId}/events\nauth_key=${creds.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${md5Hash}`;
    const authSignature = await generatePusherSignature(stringToSign, creds.secret);
    
    const url = `https://api-${creds.cluster}.pusher.com/apps/${creds.appId}/events?auth_key=${creds.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${md5Hash}&auth_signature=${authSignature}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!response.ok) {
      console.error('[Looteriya Gaming] Pusher error:', await response.text());
      return false;
    }

    console.log('[Looteriya Gaming] Pusher event sent:', event, 'to channels:', channels);
    return true;
  } catch (error) {
    console.error('[Looteriya Gaming] Pusher send error:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();
    console.log('[Looteriya Gaming] Checking payment status for:', order_id);

    if (!order_id) {
      throw new Error('Order ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get donation from database
    const { data: donation, error: dbError } = await supabase
      .from('looteriya_gaming_donations')
      .select('*')
      .eq('order_id', order_id)
      .single();

    if (dbError || !donation) {
      console.error('[Looteriya Gaming] Donation not found:', dbError);
      throw new Error('Donation not found');
    }

    // If already successful, return immediately
    if (donation.payment_status === 'success') {
      return new Response(
        JSON.stringify({
          order_id: order_id,
          final_status: 'SUCCESS',
          payment_status: 'success',
          order_status: 'PAID',
          order_amount: donation.amount,
          customer_details: { customer_name: donation.name }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check Razorpay order status
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret || !donation.razorpay_order_id) {
      throw new Error('Unable to check Razorpay status');
    }

    const razorpayAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    // Get order status
    const razorpayResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${donation.razorpay_order_id}`,
      { headers: { 'Authorization': `Basic ${razorpayAuth}` } }
    );

    if (!razorpayResponse.ok) {
      throw new Error('Failed to fetch Razorpay order status');
    }

    const razorpayOrder = await razorpayResponse.json();
    console.log('[Looteriya Gaming] Razorpay order status:', razorpayOrder.status);

    // Also check payments for more accurate status
    const paymentsResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${donation.razorpay_order_id}/payments`,
      { headers: { 'Authorization': `Basic ${razorpayAuth}` } }
    );

    let payments: any[] = [];
    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      payments = paymentsData.items || [];
    }

    // Determine final status
    let finalStatus = 'pending';
    let paymentStatus = donation.payment_status;

    if (razorpayOrder.status === 'paid' || payments.some((p: any) => p.status === 'captured')) {
      finalStatus = 'success';
      paymentStatus = 'success';
    } else if (razorpayOrder.status === 'attempted' && payments.some((p: any) => p.status === 'failed')) {
      finalStatus = 'failure';
      paymentStatus = 'failed';
    }

    // UPDATE DATABASE if payment status changed to success
    if (paymentStatus === 'success' && paymentStatus !== donation.payment_status) {
      console.log('[Looteriya Gaming] Updating payment status to success and broadcasting...');
      
      const updateData: Record<string, any> = { 
        payment_status: 'success',
        moderation_status: 'auto_approved',
        approved_at: new Date().toISOString(),
        approved_by: 'system',
      };

      // Schedule audio to play after a delay
      const delaySeconds = donation.voice_message_url || donation.hypersound_url ? 5 : 3;
      const scheduledTime = new Date(Date.now() + delaySeconds * 1000).toISOString();
      updateData.audio_scheduled_at = scheduledTime;

      const { error: updateError } = await supabase
        .from('looteriya_gaming_donations')
        .update(updateData)
        .eq('order_id', order_id);

      if (updateError) {
        console.error('[Looteriya Gaming] Database update error:', updateError);
      } else {
        console.log('[Looteriya Gaming] Database updated successfully');
        
        // Fetch streamer info for Pusher
        const { data: streamer } = await supabase
          .from('streamers')
          .select('id, streamer_slug, pusher_group, tts_enabled, tts_voice_id')
          .eq('id', donation.streamer_id)
          .single();

        if (streamer) {
          const channelSlug = streamer.streamer_slug;
          const pusherGroup = streamer.pusher_group || 1;

          // Determine donation type
          let donationType = 'text';
          if (donation.voice_message_url) donationType = 'voice';
          else if (donation.hypersound_url) donationType = 'hypersound';

          let ttsAudioUrl = donation.tts_audio_url;

          // Generate TTS for text donations with message >= 70 INR
          const shouldGenerateTTS = donationType === 'text' && 
            donation.message && 
            donation.amount >= 70 && 
            !donation.tts_audio_url &&
            streamer.tts_enabled !== false;

          if (shouldGenerateTTS) {
            console.log('[Looteriya Gaming] Generating TTS for donation...');
            try {
              const ttsResponse = await fetch(
                `${supabaseUrl}/functions/v1/generate-donation-tts`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`
                  },
                  body: JSON.stringify({
                    donationId: donation.id,
                    streamerId: donation.streamer_id,
                    tableName: 'looteriya_gaming_donations',
                    username: donation.name,
                    amount: donation.amount,
                    message: donation.message,
                    voiceId: streamer.tts_voice_id || 'en-IN-Standard-B'
                  })
                }
              );

              if (ttsResponse.ok) {
                const ttsResult = await ttsResponse.json();
                if (ttsResult.audioUrl) {
                  ttsAudioUrl = ttsResult.audioUrl;
                  console.log('[Looteriya Gaming] TTS generated:', ttsAudioUrl);
                }
              } else {
                console.error('[Looteriya Gaming] TTS generation failed:', await ttsResponse.text());
              }
            } catch (ttsError) {
              console.error('[Looteriya Gaming] TTS generation error:', ttsError);
            }
          }

          const alertData = {
            id: donation.id,
            name: donation.name,
            amount: donation.amount,
            currency: donation.currency || 'INR',
            message: donation.message,
            type: donationType,
            voice_message_url: donation.voice_message_url,
            tts_audio_url: ttsAudioUrl,
            hypersound_url: donation.hypersound_url,
            message_visible: donation.message_visible !== false,
            created_at: donation.created_at,
            moderation_status: 'auto_approved',
          };

          console.log('[Looteriya Gaming] Broadcasting Pusher events for channel:', channelSlug);

          // Send to dashboard only - OBS alerts will be triggered by audio player after delay
          await sendPusherEvent([`${channelSlug}-dashboard`], 'new-donation', alertData, pusherGroup);

          // Send to audio player - it will trigger OBS alerts after audio_scheduled_at delay
          await sendPusherEvent([`${channelSlug}-audio`], 'new-audio-message', alertData, pusherGroup);

          // Calculate and send goal progress
          const { data: goalData } = await supabase
            .from('streamers')
            .select('goal_is_active, goal_target_amount, goal_activated_at')
            .eq('id', streamer.id)
            .single();

          if (goalData?.goal_is_active && goalData.goal_target_amount) {
            const { data: donations } = await supabase
              .from('looteriya_gaming_donations')
              .select('amount, currency')
              .eq('streamer_id', streamer.id)
              .eq('payment_status', 'success')
              .gte('created_at', goalData.goal_activated_at);

            let totalProgress = 0;
            if (donations) {
              totalProgress = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
            }

            await sendPusherEvent([`${channelSlug}-goal`], 'goal-progress', {
              currentAmount: totalProgress,
              target: goalData.goal_target_amount,
              percentage: Math.min(100, (totalProgress / goalData.goal_target_amount) * 100),
            }, pusherGroup);
          }

          console.log('[Looteriya Gaming] All Pusher events sent successfully');
        } else {
          console.error('[Looteriya Gaming] Streamer not found for donation');
        }
      }
    } else if (paymentStatus !== donation.payment_status) {
      // Update failed status without broadcasting
      const { error: updateError } = await supabase
        .from('looteriya_gaming_donations')
        .update({ payment_status: paymentStatus })
        .eq('order_id', order_id);

      if (updateError) {
        console.error('[Looteriya Gaming] Database update error:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        order_id: order_id,
        final_status: finalStatus.toUpperCase(),
        payment_status: paymentStatus,
        order_status: razorpayOrder.status.toUpperCase(),
        order_amount: donation.amount,
        customer_details: { customer_name: donation.name },
        payments: payments.map((p: any) => ({
          id: p.id,
          status: p.status,
          method: p.method,
          amount: p.amount / 100
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Looteriya Gaming] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, final_status: 'PENDING' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
