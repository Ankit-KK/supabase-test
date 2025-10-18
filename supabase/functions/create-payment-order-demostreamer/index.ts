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

    const XClientId = Deno.env.get('XClientId');
    const XClientSecret = Deno.env.get('XClientSecret');
    const apiUrl = Deno.env.get('api_url') || 'https://api.cashfree.com/pg';

    if (!XClientId || !XClientSecret) {
      throw new Error('Cashfree credentials not configured');
    }

    if (!name || !amount) {
      throw new Error('Name and amount are required');
    }

    if (parseFloat(amount) < 1 || parseFloat(amount) > 100000) {
      throw new Error('Invalid amount: must be between 1 and 100000');
    }

    // Get streamer info including hyperemote settings
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('id, hyperemotes_enabled, hyperemotes_min_amount')
      .eq('streamer_slug', 'demostreamer')
      .single();

    if (streamerError || !streamerData) {
      console.error('Streamer fetch error:', streamerError);
      throw new Error('Streamer not found');
    }

    const orderId = `demostreamer_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    const cashfreePayload = {
      order_id: orderId,
      order_amount: parseFloat(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: `CUST_${Date.now()}`,
        customer_name: name,
        customer_email: 'donor@example.com',
        customer_phone: phone || '9999999999'
      },
      order_meta: {
        return_url: `https://vsevsjvtrshgeiudrnth.supabase.co/functions/v1/check-payment-status?order_id=${orderId}`,
        notify_url: 'https://vsevsjvtrshgeiudrnth.supabase.co/functions/v1/cashfree-webhook'
      }
    };

    const cashfreeResponse = await fetch(`${apiUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': XClientId,
        'x-client-secret': XClientSecret,
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
      .from('demostreamer_donations')
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
        success: true,
        order_id: orderId,
        payment_session_id: cashfreeOrder.payment_session_id,
        order_token: cashfreeOrder.order_token,
        cashfree_order_id: cashfreeOrder.cf_order_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-payment-order-demostreamer:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});