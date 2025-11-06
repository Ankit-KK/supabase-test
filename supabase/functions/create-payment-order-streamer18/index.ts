import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, amount, message, phone, voiceData, isHyperemote } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: streamer, error: streamerError } = await supabase
      .from('streamers')
      .select('id')
      .eq('streamer_slug', 'streamer18')
      .single();

    if (streamerError || !streamer) {
      throw new Error('Streamer not found');
    }

    const orderId = `streamer18_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const XClientId = Deno.env.get('XClientId')!;
    const XClientSecret = Deno.env.get('XClientSecret')!;
    const apiUrl = Deno.env.get('api_url')!;

    const cashfreeResponse = await fetch(`${apiUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': XClientId,
        'x-client-secret': XClientSecret,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: `customer_${Date.now()}`,
          customer_name: name,
          customer_email: 'donor@example.com',
          customer_phone: phone || '9999999999',
        },
        order_meta: {
          return_url: `${req.headers.get('origin')}/streamer18`,
        },
      }),
    });

    const cashfreeData = await cashfreeResponse.json();

    if (!cashfreeResponse.ok) {
      throw new Error(cashfreeData.message || 'Payment order creation failed');
    }

    await supabase.from('streamer18_donations').insert({
      streamer_id: streamer.id,
      order_id: orderId,
      name,
      amount,
      message: message || null,
      temp_voice_data: voiceData ? JSON.stringify({ blob: voiceData }) : null,
      payment_status: 'pending',
      moderation_status: isHyperemote ? 'auto_approved' : 'pending',
      is_hyperemote: isHyperemote || false,
    });

    return new Response(
      JSON.stringify({
        success: true,
        payment_session_id: cashfreeData.payment_session_id,
        order_id: orderId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
