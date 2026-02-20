import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac, createHash } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Exchange rates to INR for goal calculations
const EXCHANGE_RATES_TO_INR: Record<string, number> = {
  'INR': 1, 'USD': 89, 'EUR': 94, 'GBP': 113, 'AED': 24, 'AUD': 57
};

const convertToINR = (amount: number, currency: string): number => {
  return amount * (EXCHANGE_RATES_TO_INR[currency] || 1);
};

// Active streamer configuration
const STREAMER_CONFIG: Record<string, { table: string; prefix: string }> = {
  'ankit': { table: 'ankit_donations', prefix: 'ank_rp_' },
  'chiaa_gaming': { table: 'chiaa_gaming_donations', prefix: 'cg_rp_' },
  'looteriya_gaming': { table: 'looteriya_gaming_donations', prefix: 'lg_rp_' },
  'clumsy_god': { table: 'clumsy_god_donations', prefix: 'cg2_rp_' },
  'wolfy': { table: 'wolfy_donations', prefix: 'wf_rp_' },
  'dorp_plays': { table: 'dorp_plays_donations', prefix: 'dp2_rp_' },
  'zishu': { table: 'zishu_donations', prefix: 'zs_rp_' },
  'brigzard': { table: 'brigzard_donations', prefix: 'bz_rp_' },
  'w_era': { table: 'w_era_donations', prefix: 'we_rp_' },
  'mr_champion': { table: 'mr_champion_donations', prefix: 'mc_rp_' },
};

// Derive streamer_slug from order_id prefix
const getStreamerFromOrderId = (orderId: string): string | null => {
  // Handle legacy prefixes
  if (orderId.startsWith('chiagaming_rp_')) return 'chiaa_gaming';
  if (orderId.startsWith('ak_rp_')) return 'ankit';
  
  for (const [slug, config] of Object.entries(STREAMER_CONFIG)) {
    if (orderId.startsWith(config.prefix)) {
      return slug;
    }
  }
  return null;
};

// Helper function to get Pusher credentials based on streamer_slug
async function getPusherCredentials(streamerSlug: string, supabase: any) {
  try {
    const { data: streamer, error } = await supabase
      .from('streamers')
      .select('pusher_group, streamer_name')
      .eq('streamer_slug', streamerSlug)
      .single();

    if (error || !streamer) {
      console.error(`[Pusher] Failed to fetch pusher_group for ${streamerSlug}:`, error);
      return {
        appId: Deno.env.get('PUSHER_APP_ID_1') || Deno.env.get('PUSHER_APP_ID'),
        key: Deno.env.get('PUSHER_KEY_1') || Deno.env.get('PUSHER_KEY'),
        secret: Deno.env.get('PUSHER_SECRET_1') || Deno.env.get('PUSHER_SECRET'),
        cluster: Deno.env.get('PUSHER_CLUSTER_1') || Deno.env.get('PUSHER_CLUSTER'),
        group: 1
      };
    }

    const group = streamer.pusher_group || 1;
    
    const credentials = {
      appId: Deno.env.get(`PUSHER_APP_ID_${group}`),
      key: Deno.env.get(`PUSHER_KEY_${group}`),
      secret: Deno.env.get(`PUSHER_SECRET_${group}`),
      cluster: Deno.env.get(`PUSHER_CLUSTER_${group}`),
      group
    };

    console.log(`[Pusher] Using Group ${group} credentials for ${streamerSlug}`);
    return credentials;
  } catch (err) {
    console.error('[Pusher] Error fetching credentials:', err);
    return {
      appId: Deno.env.get('PUSHER_APP_ID_1') || Deno.env.get('PUSHER_APP_ID'),
      key: Deno.env.get('PUSHER_KEY_1') || Deno.env.get('PUSHER_KEY'),
      secret: Deno.env.get('PUSHER_SECRET_1') || Deno.env.get('PUSHER_SECRET'),
      cluster: Deno.env.get('PUSHER_CLUSTER_1') || Deno.env.get('PUSHER_CLUSTER'),
      group: 1
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Support both order_id and orderId for backwards compatibility
    const orderId = body.order_id || body.orderId;
    // Support explicit streamer_slug or derive from order_id
    let streamerSlug = body.streamer_slug;

    console.log(`[Unified] Checking payment status for order: ${orderId}`);

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Derive streamer from order prefix if not explicitly provided
    if (!streamerSlug) {
      streamerSlug = getStreamerFromOrderId(orderId);
    }

    if (!streamerSlug || !STREAMER_CONFIG[streamerSlug]) {
      console.error(`[Unified] Could not determine streamer for order: ${orderId}`);
      throw new Error('Could not determine streamer from order ID');
    }

    const config = STREAMER_CONFIG[streamerSlug];
    console.log(`[Unified] Determined streamer: ${streamerSlug}, table: ${config.table}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get donation from database
    const { data: donation, error: dbError } = await supabase
      .from(config.table)
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (dbError || !donation) {
      console.error(`[Unified] Donation not found for ${orderId}:`, dbError);
      throw new Error('Donation not found');
    }

    // If already successful, return immediately
    if (donation.payment_status === 'success') {
      console.log(`[Unified] Payment already successful for ${orderId}`);
      return new Response(
        JSON.stringify({
          order_id: orderId,
          final_status: 'SUCCESS',
          payment_status: 'success',
          order_status: 'PAID',
          customer_name: donation.name,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check Razorpay order status
    const razorpayKeyId = Deno.env.get('razorpay-keyid');
    const razorpayKeySecret = Deno.env.get('razorpay-keysecret');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    if (!donation.razorpay_order_id) {
      throw new Error('Razorpay order ID not found');
    }

    // Fetch order details from Razorpay
    const orderResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${donation.razorpay_order_id}`,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        },
      }
    );

    if (!orderResponse.ok) {
      throw new Error('Failed to fetch order from Razorpay');
    }

    const orderData = await orderResponse.json();
    console.log(`[Unified] Razorpay order status for ${orderId}:`, orderData.status);

    // Fetch payment details
    const paymentsResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${donation.razorpay_order_id}/payments`,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        },
      }
    );

    let paymentDetails = null;
    let paymentCurrency = 'INR';
    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      if (paymentsData.items && paymentsData.items.length > 0) {
        paymentDetails = paymentsData.items[0];
        paymentCurrency = paymentDetails.currency || 'INR';
      }
    }

    // Determine final status and send Pusher events if payment is now successful
    let final_status = donation.payment_status;
    if (orderData.status === 'paid' && donation.payment_status !== 'success') {
      final_status = 'success';
      
      // Fetch streamer settings for moderation mode
      const { data: streamerSettings } = await supabase
        .from('streamers')
        .select('moderation_mode, media_moderation_enabled, goal_is_active, goal_target_amount, goal_activated_at, min_tts_amount_inr, tts_enabled')
        .eq('id', donation.streamer_id)
        .single();

      // Determine moderation status
      const hasMedia = donation.media_url && donation.media_type;
      const hasVoice = !!donation.voice_message_url;
      const hasHypersound = !!donation.hypersound_url;
      const isHyperemote = donation.is_hyperemote === true;
      
      const moderationMode = streamerSettings?.moderation_mode || 'none';
      const mediaModEnabled = streamerSettings?.media_moderation_enabled ?? true;
      const requiresMediaMod = mediaModEnabled && (hasMedia || hasVoice);
      const shouldAutoApprove = isHyperemote || hasHypersound || moderationMode === 'none' || 
                                (moderationMode === 'media_only' && !requiresMediaMod);
      
      const moderationStatus = shouldAutoApprove ? 'auto_approved' : 'pending';

      // Update the database
      await supabase
        .from(config.table)
        .update({ 
          payment_status: 'success',
          moderation_status: moderationStatus,
          currency: paymentCurrency
        })
        .eq('id', donation.id);
        
      console.log(`[Unified] Updated payment status to success for ${orderId}`);

      // Get Pusher credentials and send events
      const pusherCreds = await getPusherCredentials(streamerSlug, supabase);
      
      if (pusherCreds.appId && pusherCreds.key && pusherCreds.secret && pusherCreds.cluster) {
        const sendPusherEvent = async (channel: string, eventName: string, data: any) => {
          const timestamp = Math.floor(Date.now() / 1000);
          const bodyStr = JSON.stringify(data);
          const md5Hex = createHash('md5').update(bodyStr).digest('hex');
          
          const stringToSign = `POST\n/apps/${pusherCreds.appId}/events\nauth_key=${pusherCreds.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${md5Hex}`;
          const signature = createHmac('sha256', pusherCreds.secret!).update(stringToSign).digest('hex');
          
          const url = `https://api-${pusherCreds.cluster}.pusher.com/apps/${pusherCreds.appId}/events?auth_key=${pusherCreds.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${md5Hex}&auth_signature=${signature}`;
          
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: eventName, channel, data: bodyStr })
          });
          
          if (!response.ok) {
            console.error(`[Unified] Pusher ${eventName} failed:`, await response.text());
          } else {
            console.log(`[Unified] Pusher ${eventName} sent to ${channel}`);
          }
        };

        // Send dashboard notification
        const dashboardChannel = `${streamerSlug}-dashboard`;
        await sendPusherEvent(dashboardChannel, 'new-donation', {
          id: donation.id,
          name: donation.name,
          amount: donation.amount,
          message: donation.message,
          currency: paymentCurrency,
          created_at: donation.created_at,
          payment_status: 'success',
          moderation_status: moderationStatus,
          message_visible: true,
          voice_message_url: donation.voice_message_url,
          hypersound_url: donation.hypersound_url,
          is_hyperemote: donation.is_hyperemote,
          media_url: donation.media_url,
          media_type: donation.media_type
        });

        // If donation needs moderation, also send a donation-updated event with 'pending' action
        // This ensures the moderation panel shows the new pending item in real-time
        if (!shouldAutoApprove) {
          await sendPusherEvent(dashboardChannel, 'donation-updated', {
            id: donation.id,
            action: 'pending',
            name: donation.name,
            amount: donation.amount,
            currency: paymentCurrency,
            message: donation.message,
            message_visible: true,
            created_at: donation.created_at,
            voice_message_url: donation.voice_message_url,
            media_url: donation.media_url,
            media_type: donation.media_type
          });
          console.log(`[Unified] Dashboard notified of pending donation requiring moderation`);
        }

        // Send goal progress update
        if (streamerSettings?.goal_is_active && streamerSettings?.goal_activated_at) {
          const { data: goalDonations } = await supabase
            .from(config.table)
            .select('amount, currency')
            .eq('payment_status', 'success')
            .gte('created_at', streamerSettings.goal_activated_at);

          const currentAmount = (goalDonations || []).reduce((sum: number, d: any) => 
            sum + convertToINR(d.amount, d.currency || 'INR'), 0);

          const goalChannel = `${streamerSlug}-goal`;
          await sendPusherEvent(goalChannel, 'goal-progress', {
            currentAmount,
            targetAmount: streamerSettings.goal_target_amount,
            newDonation: { 
              amount: convertToINR(donation.amount, paymentCurrency), 
              name: donation.name 
            }
          });
        }

        // Send leaderboard update for auto-approved donations
        if (shouldAutoApprove) {
          try {
            // Calculate top donator from all donations (matches moderate-donation logic)
            const { data: allDonations } = await supabase
              .from(config.table)
              .select('name, amount, currency')
              .eq('payment_status', 'success')
              .in('moderation_status', ['auto_approved', 'approved']);
            
            if (allDonations && allDonations.length > 0) {
              const donatorTotals: Record<string, { name: string; totalAmount: number }> = {};
              allDonations.forEach((d: any) => {
                const key = d.name.toLowerCase();
                const amountInINR = convertToINR(d.amount, d.currency || 'INR');
                if (!donatorTotals[key]) {
                  donatorTotals[key] = { name: d.name, totalAmount: 0 };
                }
                donatorTotals[key].totalAmount += amountInINR;
              });
              
              const sortedDonators = Object.values(donatorTotals)
                .sort((a, b) => b.totalAmount - a.totalAmount);
              
              // Send to dashboard channel (matches frontend subscription)
              await sendPusherEvent(dashboardChannel, 'leaderboard-updated', {
                topDonator: sortedDonators[0] || null,
                latestDonation: {
                  name: donation.name,
                  amount: donation.amount,
                  currency: paymentCurrency,
                  created_at: donation.created_at,
                }
              });
              console.log(`[Unified] Leaderboard update sent to ${dashboardChannel}`);
            }
          } catch (leaderboardError) {
            console.error('[Unified] Error calculating leaderboard:', leaderboardError);
          }

          // Dynamic TTS threshold from database
          const PLATFORM_TTS_FLOOR_INR = 40;
          const ttsMinAmount = Math.max(
            PLATFORM_TTS_FLOOR_INR, 
            streamerSettings?.min_tts_amount_inr || PLATFORM_TTS_FLOOR_INR
          );
          console.log(`[Unified] TTS threshold: ${ttsMinAmount} INR (db: ${streamerSettings?.min_tts_amount_inr})`);

          // Determine if TTS should be generated
          const isTextDonation = !donation.voice_message_url && !donation.hypersound_url && !hasMedia;
          const amountInINR = convertToINR(donation.amount, paymentCurrency);

          // Generate TTS if needed (for text/media donations without voice/hypersound)
          if (!donation.voice_message_url && !donation.hypersound_url) {
            const shouldGenerateTTS = (isTextDonation && amountInINR >= ttsMinAmount && streamerSettings?.tts_enabled !== false) || hasMedia;
            
            if (shouldGenerateTTS) {
              try {
                console.log('[Unified] Generating TTS for donation:', donation.id);
                await supabase.functions.invoke('generate-donation-tts', {
                  body: {
                    username: donation.name,
                    amount: donation.amount,
                    message: donation.message,
                    donationId: donation.id,
                    streamerId: donation.streamer_id,
                    isVoiceAnnouncement: false,
                    isMediaAnnouncement: hasMedia,
                    mediaType: donation.media_type,
                    currency: paymentCurrency
                  }
                });
              } catch (ttsError) {
                console.error('[Unified] TTS generation error:', ttsError);
              }
            } else if (isTextDonation) {
              // Use silent audio for donations under threshold
              const SILENT_AUDIO_URL = Deno.env.get('SILENT_AUDIO_URL') || 'https://pub-fff13c27bb0d4a1e807dfc596462b7d5.r2.dev/silence_no_sound.mp3';
              await supabase.from(config.table).update({ tts_audio_url: SILENT_AUDIO_URL }).eq('id', donation.id);
              console.log(`[Unified] Using silent audio for donation under ${ttsMinAmount} INR threshold`);
            }
          }

          // Refetch donation to get updated TTS URL
          const { data: updatedDonation } = await supabase
            .from(config.table)
            .select('*')
            .eq('id', donation.id)
            .single();

          // Send audio queue event
          const audioChannel = `${streamerSlug}-audio`;
          await sendPusherEvent(audioChannel, 'new-audio-message', {
            id: updatedDonation?.id || donation.id,
            name: updatedDonation?.name || donation.name,
            amount: updatedDonation?.amount || donation.amount,
            message: updatedDonation?.message || donation.message,
            currency: paymentCurrency,
            created_at: updatedDonation?.created_at || donation.created_at,
            payment_status: 'success',
            moderation_status: 'auto_approved',
            message_visible: true,
            voice_message_url: updatedDonation?.voice_message_url || donation.voice_message_url,
            tts_audio_url: updatedDonation?.tts_audio_url,
            hypersound_url: updatedDonation?.hypersound_url || donation.hypersound_url,
            is_hyperemote: updatedDonation?.is_hyperemote || donation.is_hyperemote,
            media_url: updatedDonation?.media_url || donation.media_url,
            media_type: updatedDonation?.media_type || donation.media_type
          });
        }
      } else {
        console.error('[Unified] Missing Pusher credentials, skipping real-time events');
      }
    } else if (orderData.status === 'attempted') {
      final_status = 'pending';
    }

    return new Response(
      JSON.stringify({
        order_id: orderId,
        order_status: orderData.status.toUpperCase(),
        final_status: final_status === 'success' ? 'SUCCESS' : 'PENDING',
        payment_status: final_status,
        amount: orderData.amount / 100,
        payment_details: paymentDetails,
        customer_name: donation.name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Unified] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
