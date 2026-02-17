import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('discord-webhook: loaded with interaction support');

// Verify Discord request signature using Ed25519
async function verifyDiscordSignature(
  publicKey: string,
  signature: string,
  timestamp: string,
  body: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const message = encoder.encode(timestamp + body);
    
    // Import the public key
    const keyData = new Uint8Array(publicKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'Ed25519' },
      false,
      ['verify']
    );
    
    const sig = new Uint8Array(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    return await crypto.subtle.verify('Ed25519', key, sig, message);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Action prefix mapping
const actionMap: Record<string, string> = {
  'a': 'approve',
  'r': 'reject',
  'h': 'hide_message',
  'b': 'ban_donor',
  'p': 'replay'
};

const actionEmojis: Record<string, string> = {
  'approve': '✅',
  'reject': '❌',
  'hide_message': '🙈',
  'ban_donor': '🚫',
  'replay': '🔄'
};

const actionLabels: Record<string, string> = {
  'approve': 'Approved',
  'reject': 'Rejected',
  'hide_message': 'Message Hidden',
  'ban_donor': 'Donor Banned',
  'replay': 'Replayed'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const publicKey = Deno.env.get('DISCORD_PUBLIC_KEY');
    if (!publicKey) {
      return new Response('Discord public key not configured', { status: 500 });
    }

    const signature = req.headers.get('x-signature-ed25519');
    const timestamp = req.headers.get('x-signature-timestamp');
    const bodyText = await req.text();

    if (!signature || !timestamp) {
      return new Response('Missing signature headers', { status: 401 });
    }

    // Verify the request signature
    const isValid = await verifyDiscordSignature(publicKey, signature, timestamp, bodyText);
    if (!isValid) {
      console.error('Invalid Discord signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const interaction = JSON.parse(bodyText);

    // Type 1: PING - Discord verification
    if (interaction.type === 1) {
      console.log('Discord PING received, responding with PONG');
      return new Response(JSON.stringify({ type: 1 }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Type 3: MESSAGE_COMPONENT (button clicks)
    if (interaction.type === 3) {
      const customId = interaction.data?.custom_id;
      const discordUserId = interaction.member?.user?.id || interaction.user?.id;
      const userName = interaction.member?.user?.username || interaction.user?.username || 'Moderator';

      console.log('Discord button click:', { customId, discordUserId, userName });

      if (!customId || !discordUserId) {
        return new Response(JSON.stringify({
          type: 4,
          data: { content: '❌ Invalid interaction', flags: 64 }
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      // Parse the callback: format is "a_ABC12345" (action prefix + short_id)
      const match = customId.match(/^([arhbp])_([A-Za-z0-9]{8})$/);
      if (!match) {
        return new Response(JSON.stringify({
          type: 4,
          data: { content: '❌ Invalid or expired action', flags: 64 }
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      const actionPrefix = match[1];
      const shortId = match[2];
      const action = actionMap[actionPrefix];

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Look up the callback mapping
      const { data: mapping, error: mapError } = await supabaseAdmin
        .from('discord_callback_mapping')
        .select('donation_id, table_name, streamer_id, action_type, expires_at')
        .eq('short_id', shortId)
        .single();

      if (mapError || !mapping) {
        console.error('Callback mapping not found:', shortId, mapError);
        return new Response(JSON.stringify({
          type: 4,
          data: { content: '❌ This action has expired or is invalid.', flags: 64 }
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      // Check expiry
      if (new Date(mapping.expires_at) < new Date()) {
        return new Response(JSON.stringify({
          type: 4,
          data: { content: '❌ This action has expired. Please use the dashboard.', flags: 64 }
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      // Find the moderator by discord_user_id
      const { data: moderator, error: modError } = await supabaseAdmin
        .from('streamers_moderators')
        .select('id, mod_name, role, can_approve, can_reject, can_hide_message, can_ban, can_replay, is_active')
        .eq('discord_user_id', discordUserId)
        .eq('streamer_id', mapping.streamer_id)
        .eq('is_active', true)
        .single();

      if (modError || !moderator) {
        console.error('Moderator not found for Discord user:', discordUserId);
        return new Response(JSON.stringify({
          type: 4,
          data: { content: '❌ You are not a registered moderator for this streamer.', flags: 64 }
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      // Fire moderate-donation WITHOUT awaiting -- respond to Discord immediately
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/moderate-donation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          action,
          donationId: mapping.donation_id,
          donationTable: mapping.table_name,
          streamerId: mapping.streamer_id,
          moderatorId: moderator.id,
          moderatorName: moderator.mod_name || userName,
          source: 'discord'
        })
      }).catch(err => console.error('Background moderate-donation error:', err));

      const emoji = actionEmojis[action] || '✅';
      const label = actionLabels[action] || action;

      return new Response(JSON.stringify({
        type: 7,
        data: {
          content: `${emoji} **${label}** by ${moderator.mod_name || userName}`,
          components: []
        }
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Unknown interaction type
    return new Response(JSON.stringify({ type: 1 }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in discord-webhook:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
