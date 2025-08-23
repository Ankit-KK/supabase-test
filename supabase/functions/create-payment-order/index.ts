import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header (optional for guest checkout)
    const authHeader = req.headers.get("Authorization");
    let user = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
    }

    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify(requestBody, null, 2));
    
    const { name, amount, message, streamer_slug, phone } = requestBody;

    // Validate input
    if (!name || !amount || amount <= 0 || amount > 100000) {
      throw new Error('Invalid input data');
    }

    if (!streamer_slug) {
      throw new Error('Streamer slug is required');
    }

    // Validate and require phone number
    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      throw new Error('Phone number is required');
    }

    console.log('Looking for streamer with slug:', streamer_slug);

    // Get streamer ID from slug
    const { data: streamerData, error: streamerError } = await supabaseClient
      .rpc('get_public_streamer_info', { slug: streamer_slug })
      .single();
    
    console.log('Streamer query result:', { streamerData, streamerError });

    if (!streamerData) {
      throw new Error('Streamer not found');
    }

    // Get payment gateway credentials
    const clientId = Deno.env.get('XClientId');
    const clientSecret = Deno.env.get('XClientSecret');
    const apiUrl = Deno.env.get('api_url');

    if (!clientId || !clientSecret || !apiUrl) {
      console.error('Missing credentials:', { clientId: !!clientId, clientSecret: !!clientSecret, apiUrl: !!apiUrl });
      throw new Error('Payment gateway not configured');
    }

    // Generate unique order ID in format: chiaa_{16-digit random number}
    const randomNum = Math.floor(Math.random() * 1e16).toString().padStart(16, '0');
    const orderId = `chiaa_${randomNum}`;
    
    // Strictly validate and use the provided phone number
    const sanitizePhone = (input: string): string => {
      const digits = input.replace(/\D/g, '');
      
      // Must be exactly 10 digits and start with 6-9 (Indian mobile format)
      if (digits.length === 10 && /^[6-9]/.test(digits)) {
        return digits;
      }
      
      throw new Error(`Invalid phone number format: ${input}. Must be 10 digits starting with 6-9`);
    };
    
    const sanitizedPhone = sanitizePhone(phone.trim());
    console.log('Phone number validation:', {
      original: phone,
      sanitized: sanitizedPhone
    });

    // Create order data matching Cashfree format - phone is now required
    const orderData = {
      order_amount: amount,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: user?.id || "guest_user",
        customer_name: name,
        customer_phone: sanitizedPhone
      },
      order_meta: {
        return_url: `${req.headers.get("origin")}/status?order_id=${orderId}`,
        notify_url: `${req.headers.get("origin")}/status?order_id=${orderId}`
      },
      order_note: message || ""
    };

    console.log('Order data to be sent:', JSON.stringify(orderData, null, 2));
    console.log('API URL:', apiUrl);
    console.log('Headers will be:', {
      'x-client-id': clientId ? 'Present' : 'Missing',
      'x-client-secret': clientSecret ? 'Present' : 'Missing',
      'x-api-version': '2025-01-01'
    });

    console.log('Creating Cashfree order:', {
      orderId,
      amount,
      customerName: name,
      customerPhone: sanitizedPhone,
      message: message || 'No message'
    });

    const response = await fetch(`${apiUrl}/orders`, {
      method: 'POST',
      headers: {
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-version': '2025-01-01'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cashfree API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Payment gateway error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Cashfree order created successfully:', {
      orderId: result.order_id,
      cfOrderId: result.cf_order_id,
      orderStatus: result.order_status,
      paymentSessionId: result.payment_session_id ? 'Present' : 'Missing'
    });

    // Validate response has required fields
    if (!result.payment_session_id) {
      console.error('Missing payment_session_id in response:', result);
      throw new Error('Invalid response from payment gateway');
    }

    // Store donation data with both order IDs and streamer ID
    const { data: donationData, error: insertError } = await supabaseClient
      .from('chia_gaming_donations')
      .insert({
        order_id: orderId,
        cashfree_order_id: result.cf_order_id,
        streamer_id: streamerData.id,
        name: name,
        amount: amount,
        message: message || '',
        payment_status: 'pending',
        moderation_status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing donation data:', insertError);
      // Don't throw error here as payment order was created successfully
    } else if (donationData) {
      console.log('Donation stored successfully; moderators will be notified after payment success.');
    }

    return new Response(JSON.stringify({
      success: true,
      payment_session_id: result.payment_session_id,
      order_id: result.order_id,
      cf_order_id: result.cf_order_id,
      order_status: result.order_status,
      order_amount: result.order_amount,
      customer_details: {
        name: name,
        phone: result.customer_details?.customer_phone
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-payment-order function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function notifyModeratorsAboutNewDonation(streamerId: string, donation: any, supabase: any) {
  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      console.log('TELEGRAM_BOT_TOKEN not configured, skipping moderator notification');
      return;
    }

    // Get all active moderators for this streamer
    const { data: moderators, error } = await supabase
      .from('streamers_moderators')
      .select('telegram_user_id, mod_name')
      .eq('streamer_id', streamerId)
      .eq('is_active', true);

    if (error || !moderators || moderators.length === 0) {
      console.log('No active moderators found for streamer:', streamerId);
      return;
    }

    const messageText = `🚨 **New Donation Needs Approval!** 🚨\n\n` +
      `💰 **Amount:** ₹${donation.amount}\n` +
      `👤 **From:** ${donation.name}\n` +
      `📅 **Time:** ${new Date(donation.created_at).toLocaleString()}\n` +
      `${donation.message ? `💬 **Message:** ${donation.message}\n` : ''}` +
      `${donation.voice_message_url ? `🎵 **Has Voice Message**\n` : ''}\n` +
      `Use /pending to review and approve/reject this donation.`;

    // Send notification to all active moderators
    for (const moderator of moderators) {
      try {
        await sendTelegramMessage(moderator.telegram_user_id, messageText, botToken);
        console.log(`Notified moderator ${moderator.mod_name} (${moderator.telegram_user_id})`);
      } catch (err) {
        console.error(`Error sending notification to moderator ${moderator.mod_name}:`, err);
      }
    }

    console.log(`Sent new donation notifications to ${moderators.length} moderators`);
  } catch (error) {
    console.error('Error in notifyModeratorsAboutNewDonation:', error);
  }
}

async function sendTelegramMessage(chatId: string, text: string, botToken: string) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: text
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Error sending Telegram message:', error);
    throw new Error(`Failed to send message: ${error}`);
  }

  return await response.json();
}