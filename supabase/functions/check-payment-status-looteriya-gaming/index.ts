import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { createHash, createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to get Pusher credentials based on group
function getPusherCredentials(group: number) {
  const suffix = group === 1 ? '' : `_${group}`;
  return {
    appId: Deno.env.get(`PUSHER_APP_ID${suffix}`) || '',
    key: Deno.env.get(`PUSHER_KEY${suffix}`) || '',
    secret: Deno.env.get(`PUSHER_SECRET${suffix}`) || '',
    cluster: Deno.env.get(`PUSHER_CLUSTER${suffix}`) || 'ap2'
  };
}

// Pusher client class (matching razorpay-webhook format)
class PusherClient {
  private appId: string;
  private key: string;
  private secret: string;
  private cluster: string;

  constructor(appId: string, key: string, secret: string, cluster: string) {
    this.appId = appId;
    this.key = key;
    this.secret = secret;
    this.cluster = cluster;
  }

  async trigger(channel: string, event: string, data: any): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    // Create payload in SAME format as razorpay-webhook (channels array, not channel string)
    const pusherPayload = {
      name: event,
      channels: [channel],
      data: JSON.stringify(data)
    };
    
    const pusherBody = JSON.stringify(pusherPayload);
    const bodyMd5 = this.md5(pusherBody);
    
    const stringToSign = `POST\n/apps/${this.appId}/events\nauth_key=${this.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}`;
    const signature = this.hmacSha256Sync(stringToSign, this.secret);
    
    const url = `https://api-${this.cluster}.pusher.com/apps/${this.appId}/events?auth_key=${this.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}&auth_signature=${signature}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: pusherBody
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Looteriya Gaming] Pusher error:', response.status, errorText);
      throw new Error(`Pusher error: ${response.status}`);
    }
    
    return response.json();
  }

  private md5(message: string): string {
    return createHash('md5').update(message).digest('hex');
  }

  private hmacSha256Sync(message: string, secret: string): string {
    return createHmac('sha256', secret).update(message).digest('hex');
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
      console.log('[Looteriya Gaming] Payment already successful');
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

    // Check Razorpay order status using standardized credentials
    const razorpayKeyId = Deno.env.get('razorpay-keyid');
    const razorpayKeySecret = Deno.env.get('razorpay-keysecret');

    if (!razorpayKeyId || !razorpayKeySecret || !donation.razorpay_order_id) {
      console.error('[Looteriya Gaming] Missing Razorpay credentials or order ID');
      throw new Error('Unable to check Razorpay status');
    }

    const razorpayAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    // Get order status
    const orderResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${donation.razorpay_order_id}`,
      { headers: { 'Authorization': `Basic ${razorpayAuth}` } }
    );

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('[Looteriya Gaming] Razorpay API error:', {
        status: orderResponse.status,
        body: errorText,
        orderId: donation.razorpay_order_id
      });
      
      // Return pending instead of error for transient failures
      return new Response(
        JSON.stringify({
          order_id,
          final_status: 'PENDING',
          payment_status: 'pending',
          error_details: `Razorpay returned ${orderResponse.status}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const razorpayOrder = await orderResponse.json();
    console.log('[Looteriya Gaming] Razorpay order status:', razorpayOrder.status);

    // Get payments for more detailed status
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
    if (razorpayOrder.status === 'paid' || payments.some((p: any) => p.status === 'captured')) {
      finalStatus = 'success';
    } else if (payments.some((p: any) => p.status === 'failed')) {
      finalStatus = 'failure';
    }

    // Process successful payment
    if (finalStatus === 'success' && donation.payment_status !== 'success') {
      console.log('[Looteriya Gaming] Processing successful payment...');

      // Get streamer info for moderation settings and Pusher group
      const { data: streamer } = await supabase
        .from('streamers')
        .select('*, moderation_mode, telegram_moderation_enabled, media_moderation_enabled')
        .eq('streamer_slug', 'looteriya_gaming')
        .single();

      // Calculate audio_scheduled_at (60 seconds from now for fraud protection)
      const audioScheduledAt = new Date(Date.now() + 60 * 1000).toISOString();

      // Determine if we need to generate TTS
      let ttsAudioUrl = donation.tts_audio_url;
      const hasVoiceMessage = donation.voice_message_url && donation.voice_message_url.length > 0;
      const hasHypersound = donation.hypersound_url && donation.hypersound_url.length > 0;
      const hasMedia = donation.media_url && donation.media_url.length > 0;
      const isTextDonation = !hasVoiceMessage && !hasHypersound && !hasMedia;
      const ttsMinAmount = 70; // INR minimum for TTS

      // Determine moderation status based on streamer settings
      const moderationMode = streamer?.moderation_mode || 'auto_approve';
      const mediaRequiresModeration = hasMedia && streamer?.media_moderation_enabled;
      const hasHypersoundContent = hasHypersound || donation.is_hyperemote;
      
      // HyperSounds always auto-approve, media goes to moderation if enabled
      const shouldAutoApprove = hasHypersoundContent || 
        (moderationMode === 'auto_approve' && !mediaRequiresModeration);
      const moderationStatus = shouldAutoApprove ? 'auto_approved' : 'pending';

      console.log(`[Looteriya Gaming] Moderation: mode=${moderationMode}, hasMedia=${hasMedia}, mediaModEnabled=${streamer?.media_moderation_enabled}, shouldAutoApprove=${shouldAutoApprove}`);

      // Generate TTS using the shared generate-donation-tts function (only for auto-approved)
      if (isTextDonation && donation.message && donation.amount >= ttsMinAmount && !ttsAudioUrl && shouldAutoApprove) {
        console.log('[Looteriya Gaming] Generating TTS via shared function...');
        
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
                donationTable: 'looteriya_gaming_donations',
                username: donation.name,
                amount: donation.amount,
                message: donation.message,
                currency: donation.currency || 'INR'
              })
            }
          );

          if (ttsResponse.ok) {
            const ttsData = await ttsResponse.json();
            if (ttsData.audioUrl) {
              ttsAudioUrl = ttsData.audioUrl;
              console.log('[Looteriya Gaming] TTS generated:', ttsAudioUrl);
            }
          } else {
            const ttsError = await ttsResponse.text();
            console.error('[Looteriya Gaming] TTS generation failed:', ttsError);
          }
        } catch (ttsError) {
          console.error('[Looteriya Gaming] TTS generation error:', ttsError);
        }
      }

      // Update donation in database
      const updateData: any = {
        payment_status: 'success',
        moderation_status: moderationStatus,
        message_visible: true,
      };

      // Only set audio_scheduled_at for auto_approved donations
      if (shouldAutoApprove) {
        updateData.audio_scheduled_at = audioScheduledAt;
      }

      if (ttsAudioUrl) {
        updateData.tts_audio_url = ttsAudioUrl;
      }

      const { error: updateError } = await supabase
        .from('looteriya_gaming_donations')
        .update(updateData)
        .eq('order_id', order_id);

      if (updateError) {
        console.error('[Looteriya Gaming] Failed to update donation:', updateError);
      } else {
        console.log('[Looteriya Gaming] Donation updated successfully');
      }

      // Get dynamic Pusher credentials based on streamer's group
      const pusherGroup = streamer?.pusher_group || 1;
      const pusherCreds = getPusherCredentials(pusherGroup);
      
      console.log('[Looteriya Gaming] Using Pusher group:', pusherGroup);

      if (pusherCreds.appId && pusherCreds.key && pusherCreds.secret) {
        const pusher = new PusherClient(
          pusherCreds.appId,
          pusherCreds.key,
          pusherCreds.secret,
          pusherCreds.cluster
        );

        try {
          // Dashboard notification (always send, with correct moderation_status)
          const dashboardPayload = {
            id: donation.id,
            name: donation.name,
            amount: donation.amount,
            message: donation.message,
            currency: donation.currency || 'INR',
            payment_status: 'success',
            moderation_status: moderationStatus,
            action: shouldAutoApprove ? 'auto_approved' : 'pending',
            created_at: donation.created_at,
            voice_message_url: donation.voice_message_url,
            hypersound_url: donation.hypersound_url,
            tts_audio_url: ttsAudioUrl,
            media_url: donation.media_url,
            media_type: donation.media_type,
          };

          await pusher.trigger('looteriya_gaming-dashboard', 'new-donation', dashboardPayload);
          console.log('[Looteriya Gaming] Dashboard notification sent');

          // Audio queue notification (only for auto_approved donations)
          if (shouldAutoApprove) {
            const audioPayload = {
              id: donation.id,
              name: donation.name,
              amount: donation.amount,
              message: donation.message,
              currency: donation.currency || 'INR',
              voice_message_url: donation.voice_message_url,
              hypersound_url: donation.hypersound_url,
              tts_audio_url: ttsAudioUrl,
              audio_scheduled_at: audioScheduledAt,
              created_at: donation.created_at,
              media_url: donation.media_url,
              media_type: donation.media_type,
            };

            await pusher.trigger('looteriya_gaming-audio', 'new-audio-message', audioPayload);
            console.log('[Looteriya Gaming] Audio queue notification sent');
          } else {
            console.log('[Looteriya Gaming] Skipping audio notification - pending moderation');
          }

          // Goal progress update (if goal is active) - with currency conversion
          if (streamer?.goal_is_active && streamer?.goal_target_amount) {
            const EXCHANGE_RATES_TO_INR: Record<string, number> = { 'INR': 1, 'USD': 89, 'EUR': 94, 'GBP': 113, 'AED': 24, 'AUD': 57 };
            
            const { data: goalDonations } = await supabase
              .from('looteriya_gaming_donations')
              .select('amount, currency')
              .eq('payment_status', 'success')
              .gte('created_at', streamer.goal_activated_at || '1970-01-01');

            const totalRaised = goalDonations?.reduce((sum: number, d: any) => {
              const rate = EXCHANGE_RATES_TO_INR[d.currency || 'INR'] || 1;
              return sum + (d.amount || 0) * rate;
            }, 0) || 0;

            await pusher.trigger('looteriya_gaming-goal', 'goal-progress', {
              currentAmount: totalRaised,
              targetAmount: streamer.goal_target_amount,
            });
            console.log('[Looteriya Gaming] Goal progress notification sent');
          }
        } catch (pusherError) {
          console.error('[Looteriya Gaming] Pusher error:', pusherError);
        }
      } else {
        console.warn('[Looteriya Gaming] Pusher credentials not configured for group:', pusherGroup);
      }
    } else if (finalStatus === 'failure' && donation.payment_status !== 'failure') {
      console.log('[Looteriya Gaming] Updating payment status to failure');
      await supabase
        .from('looteriya_gaming_donations')
        .update({ payment_status: 'failure' })
        .eq('order_id', order_id);
    }

    return new Response(
      JSON.stringify({
        order_id: order_id,
        final_status: finalStatus.toUpperCase(),
        payment_status: finalStatus,
        order_status: razorpayOrder.status.toUpperCase(),
        order_amount: donation.amount,
        customer_details: { customer_name: donation.name },
        payments: payments.map((p: any) => ({
          id: p.id,
          status: p.status,
          method: p.method,
          amount: p.amount / 100,
        })),
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
