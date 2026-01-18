import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import Pusher from 'https://esm.sh/pusher@5.2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TTS generation helper
async function generateTTS(text: string, donationId: string, supabase: any): Promise<string | null> {
  try {
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      console.error('[Looteriya Gaming] ElevenLabs API key not configured');
      return null;
    }

    // Use default voice
    const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam voice

    console.log('[Looteriya Gaming] Generating TTS for donation:', donationId);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Looteriya Gaming] ElevenLabs API error:', errorText);
      return null;
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);

    // Upload to Supabase Storage
    const fileName = `looteriya-gaming/${donationId}-tts.mp3`;
    const { error: uploadError } = await supabase.storage
      .from('voice-messages')
      .upload(fileName, audioBytes, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('[Looteriya Gaming] Storage upload error:', uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('voice-messages')
      .getPublicUrl(fileName);

    console.log('[Looteriya Gaming] TTS generated successfully:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('[Looteriya Gaming] TTS generation error:', error);
    return null;
  }
}

// Initialize Pusher client
function getPusherClient(): Pusher | null {
  try {
    const appId = Deno.env.get('PUSHER_APP_ID_2');
    const key = Deno.env.get('PUSHER_KEY_2');
    const secret = Deno.env.get('PUSHER_SECRET_2');
    const cluster = Deno.env.get('PUSHER_CLUSTER_2');

    if (!appId || !key || !secret || !cluster) {
      console.error('[Looteriya Gaming] Pusher credentials not configured');
      return null;
    }

    return new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
  } catch (error) {
    console.error('[Looteriya Gaming] Pusher initialization error:', error);
    return null;
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

    // If already successful, return immediately (webhook handled all alerts/TTS)
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

    // Check Razorpay order status
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret || !donation.razorpay_order_id) {
      throw new Error('Unable to check Razorpay status');
    }

    const razorpayAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    // Get order status
    const orderResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${donation.razorpay_order_id}`,
      { headers: { 'Authorization': `Basic ${razorpayAuth}` } }
    );

    if (!orderResponse.ok) {
      throw new Error('Failed to fetch Razorpay order status');
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

    // Process successful payment (full logic - TTS, Pusher, moderation)
    if (finalStatus === 'success' && donation.payment_status !== 'success') {
      console.log('[Looteriya Gaming] Processing successful payment...');

      // Calculate audio_scheduled_at (60 seconds from now for fraud protection)
      const audioScheduledAt = new Date(Date.now() + 60 * 1000).toISOString();

      // Determine if we need to generate TTS
      let ttsAudioUrl = donation.tts_audio_url;
      const hasVoiceMessage = donation.voice_message_url && donation.voice_message_url.length > 0;
      const hasHypersound = donation.hypersound_url && donation.hypersound_url.length > 0;
      const isTextDonation = !hasVoiceMessage && !hasHypersound;
      const ttsMinAmount = 70; // INR minimum for TTS

      if (isTextDonation && donation.message && donation.amount >= ttsMinAmount && !ttsAudioUrl) {
        console.log('[Looteriya Gaming] Generating TTS for text donation...');
        const ttsText = `${donation.name} donated ${donation.amount} rupees and says: ${donation.message}`;
        ttsAudioUrl = await generateTTS(ttsText, donation.id, supabase);
      }

      // Update donation in database
      const updateData: any = {
        payment_status: 'success',
        moderation_status: 'auto_approved',
        audio_scheduled_at: audioScheduledAt,
        message_visible: true,
      };

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

      // Send Pusher notifications
      const pusher = getPusherClient();
      if (pusher) {
        try {
          // Get streamer info for goal updates
          const { data: streamer } = await supabase
            .from('streamers')
            .select('*')
            .eq('streamer_slug', 'looteriya-gaming')
            .single();

          // Dashboard notification
          const dashboardPayload = {
            id: donation.id,
            name: donation.name,
            amount: donation.amount,
            message: donation.message,
            currency: donation.currency || 'INR',
            payment_status: 'success',
            moderation_status: 'auto_approved',
            created_at: donation.created_at,
            voice_message_url: donation.voice_message_url,
            hypersound_url: donation.hypersound_url,
            tts_audio_url: ttsAudioUrl,
          };

          await pusher.trigger('looteriya_gaming-dashboard', 'new-donation', dashboardPayload);
          console.log('[Looteriya Gaming] Dashboard notification sent');

          // Audio queue notification
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
          };

          await pusher.trigger('looteriya_gaming-audio', 'new-audio-message', audioPayload);
          console.log('[Looteriya Gaming] Audio queue notification sent');

          // Goal progress update (if goal is active)
          if (streamer?.goal_is_active && streamer?.goal_target_amount) {
            const { data: goalDonations } = await supabase
              .from('looteriya_gaming_donations')
              .select('amount')
              .eq('payment_status', 'success')
              .gte('created_at', streamer.goal_activated_at || '1970-01-01');

            const totalRaised = goalDonations?.reduce((sum: number, d: any) => sum + (d.amount || 0), 0) || 0;
            const progress = Math.min((totalRaised / streamer.goal_target_amount) * 100, 100);

            await pusher.trigger('looteriya_gaming-goal', 'goal-update', {
              goal_name: streamer.goal_name,
              goal_target_amount: streamer.goal_target_amount,
              current_amount: totalRaised,
              progress: progress,
            });
            console.log('[Looteriya Gaming] Goal progress notification sent');
          }
        } catch (pusherError) {
          console.error('[Looteriya Gaming] Pusher error:', pusherError);
        }
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
