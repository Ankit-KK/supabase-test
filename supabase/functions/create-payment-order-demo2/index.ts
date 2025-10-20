import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Demo2 payment order request received');
    
    const { name, amount, message, phone, voiceData } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const cashfreeAppId = Deno.env.get('CASHFREE_APP_ID');
    const cashfreeSecretKey = Deno.env.get('CASHFREE_SECRET_KEY');
    
    if (!cashfreeAppId || !cashfreeSecretKey) {
      throw new Error('Cashfree credentials not configured');
    }

    if (!amount || amount < 5 || amount > 100000) {
      throw new Error('Invalid amount. Must be between ₹5 and ₹100,000');
    }

    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('id, hyperemotes_enabled, hyperemotes_min_amount')
      .eq('streamer_slug', 'demo2')
      .single();

    if (streamerError) {
      console.error('Error fetching streamer:', streamerError);
      throw new Error('Failed to fetch streamer data');
    }

    const orderId = `demo2_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const cashfreeOrderData = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: `customer_${Date.now()}`,
        customer_name: name,
        customer_phone: phone || '9999999999',
      },
      order_meta: {
        return_url: `https://vsevsjvtrshgeiudrnth.supabase.co/functions/v1/check-payment-status?order_id=${orderId}`,
      },
    };

    console.log('Creating Cashfree order:', orderId);
    
    const cashfreeResponse = await fetch('https://sandbox.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': cashfreeAppId,
        'x-client-secret': cashfreeSecretKey,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify(cashfreeOrderData),
    });

    const cashfreeData = await cashfreeResponse.json();
    
    if (!cashfreeResponse.ok) {
      console.error('Cashfree error:', cashfreeData);
      throw new Error('Failed to create payment order');
    }

    const isHyperemote = streamerData.hyperemotes_enabled && 
                        amount >= (streamerData.hyperemotes_min_amount || 50);

    const moderationStatus = amount >= 100 ? 'pending' : 'auto_approved';
    
    const { error: insertError } = await supabase
      .from('demo2_donations')
      .insert({
        order_id: orderId,
        name,
        amount,
        message: message || null,
        temp_voice_data: voiceData || null,
        payment_status: 'pending',
        moderation_status: moderationStatus,
        streamer_id: streamerData.id,
        is_hyperemote: isHyperemote,
      });

    if (insertError) {
      console.error('Error inserting donation:', insertError);
      throw new Error('Failed to create donation record');
    }

    console.log('Demo2 donation created successfully:', orderId);

    return new Response(
      JSON.stringify({
        success: true,
        payment_session_id: cashfreeData.payment_session_id,
        order_id: orderId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-payment-order-demo2:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
