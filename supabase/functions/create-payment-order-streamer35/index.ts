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
    const { name, amount, message, voiceBlob, emoji } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: streamer, error: streamerError } = await supabase
      .from('streamers')
      .select('id')
      .eq('streamer_slug', 'streamer35')
      .single();

    if (streamerError || !streamer) {
      throw new Error('Streamer not found');
    }

    const orderId = `streamer35_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const cashfreeResponse = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': Deno.env.get('CASHFREE_APP_ID')!,
        'x-client-secret': Deno.env.get('CASHFREE_SECRET_KEY')!,
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
          customer_phone: '9999999999',
        },
        order_meta: {
          return_url: `${req.headers.get('origin')}/streamer35`,
        },
      }),
    });

    const cashfreeData = await cashfreeResponse.json();

    if (!cashfreeResponse.ok) {
      throw new Error(cashfreeData.message || 'Payment order creation failed');
    }

    const isHyperemote = amount >= 50;

    await supabase.from('streamer35_donations').insert({
      streamer_id: streamer.id,
      order_id: orderId,
      name,
      amount,
      message: message || null,
      temp_voice_data: voiceBlob ? JSON.stringify({ blob: voiceBlob }) : null,
      payment_status: 'pending',
      moderation_status: isHyperemote ? 'auto_approved' : 'pending',
      is_hyperemote: isHyperemote,
    });

    return new Response(
      JSON.stringify({
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
