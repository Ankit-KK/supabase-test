import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, amount, message, phone, voiceData } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const xClientId = Deno.env.get('XClientId');
    const xClientSecret = Deno.env.get('XClientSecret');
    const apiUrl = Deno.env.get('api_url');

    if (!xClientId || !xClientSecret || !apiUrl) {
      throw new Error('Cashfree credentials not configured');
    }

    if (!name || !amount) {
      throw new Error('Name and amount are required');
    }

    if (parseFloat(amount) < 1 || parseFloat(amount) > 100000) {
      throw new Error('Invalid amount: must be between 1 and 100000');
    }

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      throw new Error('Invalid phone number format');
    }

    // Get streamer info including hyperemote settings
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('id, hyperemotes_enabled, hyperemotes_min_amount')
      .eq('streamer_slug', 'chiaa_gaming')
      .single();

    if (streamerError || !streamerData) {
      console.error('Streamer fetch error:', streamerError);
      throw new Error('Streamer not found');
    }

    const orderId = `chiagaming_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const cashfreePayload = {
      order_id: orderId,
      order_amount: parseFloat(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: `customer_${Date.now()}`,
        customer_name: name,
        customer_phone: phone
      },
      order_meta: {
        return_url: `${req.headers.get('origin')}/chiaa-gaming?order_id=${orderId}&status={order_status}`,
        notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/cashfree-webhook`
      }
    };

    const cashfreeResponse = await fetch(`${apiUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': xClientId,
        'x-client-secret': xClientSecret,
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify(cashfreePayload)
    });

    if (!cashfreeResponse.ok) {
      const errorText = await cashfreeResponse.text();
      console.error('Cashfree API error:', errorText);
      throw new Error('Failed to create payment order with Cashfree');
    }

    const cashfreeOrder = await cashfreeResponse.json();

    // Determine if this is a hyperemote based on streamer settings
    const minAmount = streamerData.hyperemotes_min_amount || 50;
    const isHyperemoteValue = streamerData.hyperemotes_enabled && parseFloat(amount) >= minAmount;
    
    // Store donation in database
    const { data: donation, error: donationError } = await supabase
      .from('chiaa_gaming_donations')
      .insert({
        name: name,
        amount: parseFloat(amount),
        message: message || null,
        order_id: orderId,
        payment_status: 'pending',
        moderation_status: isHyperemoteValue ? 'auto_approved' : (parseFloat(amount) >= 100 ? 'approved' : 'pending'),
        streamer_id: streamerData.id,
        temp_voice_data: voiceData || null,
        is_hyperemote: isHyperemoteValue
      })
      .select()
      .single();

    if (donationError) {
      console.error('Database insert error:', donationError);
      throw new Error('Failed to store donation data');
    }

    return new Response(
      JSON.stringify({
        payment_session_id: cashfreeOrder.payment_session_id,
        order_id: orderId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-payment-order-chiagaming:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});