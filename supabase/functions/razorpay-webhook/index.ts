// Egress-optimized razorpay-webhook: uses order_lookup (2 indexed queries instead of 10 sequential scans),
// RPC leaderboard aggregation, idempotent updates, and no post-TTS refetch.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash, createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
}

const EXCHANGE_RATES_TO_INR: Record<string, number> = {
  'INR': 1, 'USD': 89, 'EUR': 94, 'GBP': 113, 'AED': 24, 'AUD': 57
};
const convertToINR = (amount: number, currency: string): number => amount * (EXCHANGE_RATES_TO_INR[currency] || 1);

// donation_table_id -> table name mapping (matches order_lookup)
const DONATION_TABLE_ID_MAP: Record<number, string> = {
  0: 'ankit_donations', 1: 'chiaa_gaming_donations', 2: 'looteriya_gaming_donations',
  3: 'clumsy_god_donations', 4: 'wolfy_donations', 5: 'dorp_plays_donations',
  6: 'zishu_donations', 7: 'brigzard_donations', 8: 'w_era_donations', 9: 'mr_champion_donations',
  10: 'demigod_donations',16: 'gaming_with_latifa_donations',
  11: 'nova_plays_donations',12: 'starlight_anya_donations',
  14: 'slidey_playz_donations',15: 'eryx_donations',
};

// table name -> streamer_slug mapping (for Pusher channels)
const TABLE_TO_SLUG: Record<string, string> = {
  'ankit_donations': 'ankit', 'chiaa_gaming_donations': 'chiaa_gaming',
  'looteriya_gaming_donations': 'looteriya_gaming', 'clumsy_god_donations': 'clumsy_god',
  'wolfy_donations': 'wolfy', 'dorp_plays_donations': 'dorp_plays',
  'zishu_donations': 'zishu', 'brigzard_donations': 'brigzard',
  'w_era_donations': 'w_era', 'mr_champion_donations': 'mr_champion',
  'demigod_donations': 'demigod','gaming_with_latifa_donations': 'gaming_with_latifa',
  'nova_plays_donations': 'nova_plays','starlight_anya_donations': 'starlight_anya',
  'slidey_playz_donations': 'slidey_playz','eryx_donations': 'eryx',
};

// Scoped fields for donation fetch (no select('*'))
const DONATION_FIELDS = 'id, payment_status, amount, amount_inr, currency, name, message, streamer_id, voice_message_url, tts_audio_url, hypersound_url, is_hyperemote, media_url, media_type, order_id, razorpay_order_id, mod_notified, created_at';

function generateShortId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

async function createCallbackMapping(supabase: any, donationId: string, tableName: string, streamerId: string, action: string): Promise<string> {
  const shortId = generateShortId();
  try {
    const { error } = await supabase.from('telegram_callback_mapping').insert({
      short_id: shortId, donation_id: donationId, table_name: tableName,
      streamer_id: streamerId, action_type: action,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
    if (error) {
      console.error('Error creating callback mapping:', error);
      return `${action.charAt(0)}_${donationId.substring(0, 8)}`;
    }
    const actionPrefix = { 'approve': 'a', 'reject': 'r', 'hide_message': 'h', 'ban_donor': 'b', 'replay': 'p' }[action] || action.charAt(0);
    return `${actionPrefix}_${shortId}`;
  } catch (err) {
    console.error('Error in createCallbackMapping:', err);
    return `${action.charAt(0)}_${donationId.substring(0, 8)}`;
  }
}

async function getPusherCredentials(streamerSlug: string, supabase: any) {
  try {
    const { data: streamer, error } = await supabase
      .from('streamers').select('pusher_group, streamer_name').eq('streamer_slug', streamerSlug).single();
    if (error || !streamer) {
      console.error(`[Pusher] Failed to fetch pusher_group for ${streamerSlug}:`, error);
      return { appId: Deno.env.get('PUSHER_APP_ID_1') || Deno.env.get('PUSHER_APP_ID'), key: Deno.env.get('PUSHER_KEY_1') || Deno.env.get('PUSHER_KEY'), secret: Deno.env.get('PUSHER_SECRET_1') || Deno.env.get('PUSHER_SECRET'), cluster: Deno.env.get('PUSHER_CLUSTER_1') || Deno.env.get('PUSHER_CLUSTER'), group: 1 };
    }
    const group = streamer.pusher_group || 1;
    return { appId: Deno.env.get(`PUSHER_APP_ID_${group}`), key: Deno.env.get(`PUSHER_KEY_${group}`), secret: Deno.env.get(`PUSHER_SECRET_${group}`), cluster: Deno.env.get(`PUSHER_CLUSTER_${group}`), group };
  } catch (err) {
    console.error('[Pusher] Error fetching credentials:', err);
    return { appId: Deno.env.get('PUSHER_APP_ID_1') || Deno.env.get('PUSHER_APP_ID'), key: Deno.env.get('PUSHER_KEY_1') || Deno.env.get('PUSHER_KEY'), secret: Deno.env.get('PUSHER_SECRET_1') || Deno.env.get('PUSHER_SECRET'), cluster: Deno.env.get('PUSHER_CLUSTER_1') || Deno.env.get('PUSHER_CLUSTER'), group: 1 };
  }
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

    if (!webhookSecret) {
      console.error('SECURITY: Webhook secret not configured - rejecting request')
      return new Response('Unauthorized - webhook secret not configured', { status: 401, headers: corsHeaders })
    }
    if (!webhookSignature) {
      console.error('SECURITY: No signature in webhook request - rejecting request')
      return new Response('Unauthorized - missing signature', { status: 401, headers: corsHeaders })
    }

    const expectedSignature = createHmac('sha256', webhookSecret).update(webhookBody).digest('hex')
    if (webhookSignature !== expectedSignature) {
      console.error('SECURITY: Invalid webhook signature - rejecting request')
      return new Response('Unauthorized - invalid signature', { status: 401, headers: corsHeaders })
    }
    console.log('Webhook signature verified ✓')

    const webhookData = JSON.parse(webhookBody)
    const event = webhookData.event
    console.log('Webhook event:', event)

    if (event !== 'payment.captured' && event !== 'payment.failed') {
      console.log('Ignoring event:', event)
      return new Response('Event ignored', { status: 200, headers: corsHeaders })
    }

    const razorpayOrderId = webhookData.payload?.payment?.entity?.order_id
    const paymentCurrency = webhookData.payload?.payment?.entity?.currency || 'INR'
    console.log('Razorpay Order ID:', razorpayOrderId, 'Currency:', paymentCurrency)

    if (!razorpayOrderId) {
      console.log('No Razorpay order ID found, ignoring')
      return new Response('No order ID', { status: 400, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // === EGRESS OPTIMIZATION: Use order_lookup instead of 10-table sequential scan ===
    const { data: lookup, error: lookupError } = await supabase
      .from('order_lookup')
      .select('streamer_slug, donation_table_id, donation_id')
      .eq('razorpay_order_id', razorpayOrderId)
      .maybeSingle();

    let tableName: string;
    let streamerSlug: string;
    let donation: any;

    if (lookup) {
      // Fast path: order_lookup found (2 indexed queries total)
      tableName = DONATION_TABLE_ID_MAP[lookup.donation_table_id];
      streamerSlug = lookup.streamer_slug;

      if (!tableName) {
        console.error('Invalid donation_table_id:', lookup.donation_table_id);
        return new Response('Invalid table mapping', { status: 500, headers: corsHeaders });
      }

      const { data: donationData, error: donationError } = await supabase
        .from(tableName)
        .select(DONATION_FIELDS)
        .eq('id', lookup.donation_id)
        .single();

      if (donationError || !donationData) {
        console.error('Donation not found via order_lookup:', donationError);
        return new Response('Donation not found', { status: 404, headers: corsHeaders });
      }
      donation = donationData;
    } else {
      // Fallback: legacy orders without order_lookup - search by razorpay_order_id across tables
      console.warn('[Webhook] order_lookup miss, falling back to sequential scan for:', razorpayOrderId);
      let found = false;
      for (const [tableId, tName] of Object.entries(DONATION_TABLE_ID_MAP)) {
        const { data } = await supabase.from(tName).select(DONATION_FIELDS).eq('razorpay_order_id', razorpayOrderId).maybeSingle();
        if (data) {
          donation = data;
          tableName = tName;
          streamerSlug = TABLE_TO_SLUG[tName];
          found = true;
          break;
        }
      }
      if (!found) {
        console.error('Donation not found for Razorpay order:', razorpayOrderId);
        return new Response('Donation not found', { status: 404, headers: corsHeaders });
      }
    }

    console.log('Found donation:', donation.order_id, 'table:', tableName);

    // Idempotency guard: skip if already processed
    if (donation.payment_status === 'success') {
      console.log('Payment already processed:', donation.order_id)
      return new Response('Already processed', { status: 200, headers: corsHeaders })
    }

    const isSuccess = event === 'payment.captured'
    const newStatus = isSuccess ? 'success' : 'failed'
    console.log('Updating payment status to:', newStatus)

    const audioDelay = 10000;
    const audioScheduledAt = new Date(Date.now() + audioDelay).toISOString();

    // Fetch streamer settings (scoped fields)
    const { data: streamerSettings, error: streamerError } = await supabase
      .from('streamers')
      .select('moderation_mode, telegram_moderation_enabled, discord_moderation_enabled, media_moderation_enabled, min_tts_amount_inr, tts_enabled')
      .eq('id', donation.streamer_id)
      .single();

    if (streamerError) console.error('Error fetching streamer settings:', streamerError);

    const moderationMode = streamerSettings?.moderation_mode || 'auto_approve';
    const isHypersound = donation.hypersound_url || donation.is_hyperemote;
    const hasMedia = donation.media_url && donation.media_url.length > 0;
    const mediaRequiresModeration = hasMedia && streamerSettings?.media_moderation_enabled;
    const shouldAutoApprove = isHypersound || (moderationMode === 'auto_approve' && !mediaRequiresModeration);
    
    let moderationStatus = 'pending';
    if (shouldAutoApprove) moderationStatus = 'auto_approved';

    console.log('Moderation decision:', { moderationMode, isHypersound, hasMedia, mediaRequiresModeration, shouldAutoApprove, moderationStatus });

    // Compute amount_inr if not already set
    const amountInINR = donation.amount_inr || convertToINR(donation.amount, paymentCurrency);

    const updateData: any = {
      payment_status: newStatus,
      moderation_status: isSuccess ? moderationStatus : 'rejected',
      amount_inr: amountInINR,
    };
    if (isSuccess && shouldAutoApprove) updateData.audio_scheduled_at = audioScheduledAt;

    // Idempotent DB update: only update if not already 'success' (prevents race conditions)
    const { data: updatedRow, error: updateError } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', donation.id)
      .neq('payment_status', 'success')
      .select('id')
      .maybeSingle();

    if (updateError) {
      console.error('Error updating donation:', updateError);
      throw updateError;
    }

    if (!updatedRow) {
      console.log('Already processed (race condition), skipping');
      return new Response('Already processed', { status: 200, headers: corsHeaders });
    }

    console.log('Donation updated successfully');

    if (isSuccess) {
      const pusherCredentials = await getPusherCredentials(streamerSlug, supabase);

      if (!pusherCredentials.appId || !pusherCredentials.key || !pusherCredentials.secret || !pusherCredentials.cluster) {
        console.error('Missing Pusher credentials for streamer:', streamerSlug);
      } else {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        
        const sendPusherEvent = async (channel: string, eventName: string, eventData: any) => {
          const body = JSON.stringify({ name: eventName, channel: channel, data: JSON.stringify(eventData) });
          const bodyMd5 = createHash('md5').update(body).digest('hex');
          const stringToSign = `POST\n/apps/${pusherCredentials.appId}/events\nauth_key=${pusherCredentials.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}`;
          const signature = createHmac('sha256', pusherCredentials.secret!).update(stringToSign).digest('hex');
          const pusherUrl = `https://api-${pusherCredentials.cluster}.pusher.com/apps/${pusherCredentials.appId}/events?auth_key=${pusherCredentials.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}&auth_signature=${signature}`;
          const response = await fetch(pusherUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
          if (!response.ok) { const errorText = await response.text(); console.error(`Pusher ${eventName} failed:`, errorText); }
          else { console.log(`Pusher ${eventName} sent successfully to ${channel}`); }
        };

        const dashboardChannel = `${streamerSlug}-dashboard`;
        await sendPusherEvent(dashboardChannel, 'new-donation', {
          id: donation.id, name: donation.name, amount: donation.amount, message: donation.message,
          currency: paymentCurrency, created_at: donation.created_at, payment_status: 'success',
          moderation_status: moderationStatus, message_visible: true,
          voice_message_url: donation.voice_message_url, tts_audio_url: donation.tts_audio_url,
          hypersound_url: donation.hypersound_url, is_hyperemote: donation.is_hyperemote,
          media_url: donation.media_url, media_type: donation.media_type
        });

        if (!shouldAutoApprove) {
          await sendPusherEvent(dashboardChannel, 'donation-updated', {
            id: donation.id, action: 'pending', name: donation.name, amount: donation.amount,
            currency: paymentCurrency, message: donation.message, message_visible: true,
            created_at: donation.created_at, voice_message_url: donation.voice_message_url,
            media_url: donation.media_url, media_type: donation.media_type
          });
          console.log('Dashboard notified of pending donation requiring moderation');
        }

        // Goal progress update
        const goalChannel = `${streamerSlug}-goal`;
        try {
          const { data: streamerGoal } = await supabase.from('streamers')
            .select('goal_is_active, goal_target_amount, goal_activated_at')
            .eq('id', donation.streamer_id).single();

          if (streamerGoal?.goal_is_active && streamerGoal?.goal_activated_at) {
            const { data: goalDonations } = await supabase.from(tableName)
              .select('amount, currency').eq('payment_status', 'success')
              .gte('created_at', streamerGoal.goal_activated_at);
            const currentAmount = (goalDonations || []).reduce((sum: number, d: any) => sum + convertToINR(d.amount, d.currency || 'INR'), 0);
            await sendPusherEvent(goalChannel, 'goal-progress', {
              currentAmount, targetAmount: streamerGoal.goal_target_amount,
              newDonation: { amount: amountInINR, name: donation.name }
            });
            console.log(`Goal progress sent: ${currentAmount}/${streamerGoal.goal_target_amount}`);
          }
        } catch (goalError) { console.error('Goal progress update error:', goalError); }

        // === EGRESS OPTIMIZATION: RPC leaderboard instead of full table scan ===
        if (shouldAutoApprove) {
          try {
            // Atomic increment (no full table scan)
            await supabase.rpc('increment_donator_total', {
              p_streamer_slug: streamerSlug,
              p_donator_name: donation.name,
              p_amount: amountInINR
            });

            // Read top donator (index-only scan, 1 row)
            const { data: topDonator } = await supabase
              .from('streamer_donator_totals')
              .select('donator_name, total_amount')
              .eq('streamer_slug', streamerSlug)
              .order('total_amount', { ascending: false })
              .limit(1)
              .maybeSingle();

            await sendPusherEvent(dashboardChannel, 'leaderboard-updated', {
              topDonator: topDonator ? { name: topDonator.donator_name, totalAmount: topDonator.total_amount } : null,
              latestDonation: { name: donation.name, amount: donation.amount, currency: paymentCurrency, created_at: donation.created_at }
            });
            console.log(`Leaderboard update sent to ${dashboardChannel}`);
          } catch (leaderboardError) { console.error('Error with leaderboard RPC:', leaderboardError); }
        }

        // Audio queue for auto-approved donations
        if (shouldAutoApprove) {
          const PLATFORM_TTS_FLOOR_INR = 40;
          const ttsMinAmount = Math.max(PLATFORM_TTS_FLOOR_INR, streamerSettings?.min_tts_amount_inr || PLATFORM_TTS_FLOOR_INR);
          console.log(`[Webhook] TTS threshold: ${ttsMinAmount} INR, Donation: ${amountInINR} INR`);

          const isTextDonation = !donation.voice_message_url && !donation.hypersound_url && !hasMedia;
          const shouldGenerateTTS = (!donation.voice_message_url && !donation.hypersound_url) &&
            ((isTextDonation && amountInINR >= ttsMinAmount) || hasMedia) &&
            streamerSettings?.tts_enabled !== false;

          let ttsAudioUrl = donation.tts_audio_url;

          if (shouldGenerateTTS) {
            try {
              console.log('Generating TTS for donation:', donation.id);
              const ttsResponse = await supabase.functions.invoke('generate-donation-tts', {
                body: {
                  username: donation.name, amount: donation.amount, message: donation.message,
                  donationId: donation.id, streamerId: donation.streamer_id,
                  isVoiceAnnouncement: false, isMediaAnnouncement: hasMedia,
                  mediaType: donation.media_type, currency: paymentCurrency
                }
              });
              if (ttsResponse.error) {
                console.error('TTS generation failed:', ttsResponse.error);
                // Fallback to silent audio so visual alert still shows
                const SILENT_AUDIO_URL = Deno.env.get('SILENT_AUDIO_URL') || 'https://pub-fff13c27bb0d4a1e807dfc596462b7d5.r2.dev/silence_no_sound.mp3';
                ttsAudioUrl = SILENT_AUDIO_URL;
                await supabase.from(tableName).update({ tts_audio_url: SILENT_AUDIO_URL }).eq('id', donation.id);
                console.log('[Webhook] TTS failed, using silent audio fallback for visual alert');
              } else {
                ttsAudioUrl = ttsResponse.data?.audioUrl || ttsAudioUrl;
                console.log('TTS generated successfully:', ttsAudioUrl);
              }
            } catch (ttsError) {
              console.error('TTS generation error:', ttsError);
              // Fallback to silent audio so visual alert still shows
              const SILENT_AUDIO_URL = Deno.env.get('SILENT_AUDIO_URL') || 'https://pub-fff13c27bb0d4a1e807dfc596462b7d5.r2.dev/silence_no_sound.mp3';
              ttsAudioUrl = SILENT_AUDIO_URL;
              await supabase.from(tableName).update({ tts_audio_url: SILENT_AUDIO_URL }).eq('id', donation.id);
              console.log('[Webhook] TTS error, using silent audio fallback for visual alert');
            }
          } else if (isTextDonation) {
            const SILENT_AUDIO_URL = Deno.env.get('SILENT_AUDIO_URL') || 'https://pub-fff13c27bb0d4a1e807dfc596462b7d5.r2.dev/silence_no_sound.mp3';
            await supabase.from(tableName).update({ tts_audio_url: SILENT_AUDIO_URL }).eq('id', donation.id);
            ttsAudioUrl = SILENT_AUDIO_URL;
            console.log(`[Webhook] Using silent audio for donation under ${ttsMinAmount} INR threshold`);
          }

          // === EGRESS OPTIMIZATION: No post-TTS refetch - use ttsAudioUrl directly ===
          const audioChannel = `${streamerSlug}-audio`;
          await sendPusherEvent(audioChannel, 'new-audio-message', {
            id: donation.id, name: donation.name, amount: donation.amount, message: donation.message,
            currency: paymentCurrency, created_at: donation.created_at, payment_status: 'success',
            moderation_status: 'auto_approved', voice_message_url: donation.voice_message_url,
            tts_audio_url: ttsAudioUrl, hypersound_url: donation.hypersound_url,
            is_hyperemote: donation.is_hyperemote, media_url: donation.media_url,
            media_type: donation.media_type, audio_scheduled_at: audioScheduledAt
          });
        }

        // Telegram/Discord notifications for moderation-required donations
        if ((streamerSettings?.telegram_moderation_enabled || streamerSettings?.discord_moderation_enabled) && !shouldAutoApprove) {
          try {
            let callbackData = null;
            if (!shouldAutoApprove) {
              const approveCallback = await createCallbackMapping(supabase, donation.id, tableName, donation.streamer_id, 'approve');
              const rejectCallback = await createCallbackMapping(supabase, donation.id, tableName, donation.streamer_id, 'reject');
              const hideCallback = await createCallbackMapping(supabase, donation.id, tableName, donation.streamer_id, 'hide_message');
              const banCallback = await createCallbackMapping(supabase, donation.id, tableName, donation.streamer_id, 'ban_donor');
              callbackData = { approve: approveCallback, reject: rejectCallback, hide_message: hideCallback, ban_donor: banCallback };
            }

            const { error: notifyError } = await supabase.functions.invoke('notify-new-donations', {
              body: {
                donation: {
                  id: donation.id, name: donation.name, amount: donation.amount,
                  message: donation.message, currency: paymentCurrency,
                  voice_message_url: donation.voice_message_url,
                  media_url: donation.media_url, media_type: donation.media_type,
                  moderation_status: shouldAutoApprove ? 'auto_approved' : 'pending'
                },
                streamer_id: donation.streamer_id, table_name: tableName,
                is_auto_approved: shouldAutoApprove, callback_data: callbackData
              }
            });
            if (notifyError) console.error('Failed to send notification:', notifyError);
            else console.log('Notification sent successfully');
          } catch (telegramError) { console.error('Notification error:', telegramError); }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
