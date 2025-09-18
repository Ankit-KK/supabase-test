import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, amount, message, voice_blob, streamer_slug, streamer_id } = await req.json();

    if (!name || !amount || amount <= 0 || !streamer_slug) {
      throw new Error('Invalid donation data: name, amount, and streamer_slug are required');
    }

    console.log(`Creating payment order for ${streamer_slug}: ${name} - ₹${amount}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get streamer details
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('id, hyperemotes_enabled, hyperemotes_min_amount')
      .eq('streamer_slug', streamer_slug)
      .single();

    if (streamerError || !streamerData) {
      throw new Error('Streamer not found');
    }

    const isHyperemote = streamerData.hyperemotes_enabled && 
                        amount >= (streamerData.hyperemotes_min_amount || 50);

    const orderId = `${streamer_slug}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const cashfreeAppId = Deno.env.get('CASHFREE_APP_ID');
    const cashfreeSecretKey = Deno.env.get('CASHFREE_SECRET_KEY');
    const cashfreeBaseUrl = Deno.env.get('CASHFREE_BASE_URL') || 'https://sandbox.cashfree.com/pg';

    if (!cashfreeAppId || !cashfreeSecretKey) {
      throw new Error('Cashfree configuration missing');
    }

    const cashfreeOrder = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: `donor_${Date.now()}`,
        customer_name: name,
        customer_email: `donor@${streamer_slug}.com`,
        customer_phone: '9999999999'
      }
    };

    const cashfreeResponse = await fetch(`${cashfreeBaseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': cashfreeAppId,
        'x-client-secret': cashfreeSecretKey,
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify(cashfreeOrder)
    });

    const cashfreeData = await cashfreeResponse.json();

    if (!cashfreeResponse.ok) {
      throw new Error(`Cashfree error: ${JSON.stringify(cashfreeData)}`);
    }

    // Determine table name
    const tableMap: Record<string, string> = {
      'ankit': 'ankit_donations',
      'chia_gaming': 'chia_gaming_donations', 
      'demostreamer': 'demostreamer_donations',
      'techgamer': 'techgamer_donations',
      'musicstream': 'musicstream_donations',
      'codelive': 'codelive_donations',
      'artcreate': 'artcreate_donations',
      'fitnessflow': 'fitnessflow_donations'
    };
    
    const tableName = tableMap[streamer_slug] || 'demostreamer_donations';

    // Store donation in appropriate table
    const { data: donationData, error: donationError } = await supabase
      .from(tableName)
      .insert({
        name: name.trim(),
        amount: parseFloat(amount),
        message: message?.trim() || null,
        streamer_id: streamerData.id,
        cashfree_order_id: orderId,
        order_id: orderId,
        payment_status: 'pending',
        moderation_status: isHyperemote ? 'auto_approved' : 'pending',
        is_hyperemote: isHyperemote,
        temp_voice_data: voice_blob ? JSON.stringify(voice_blob) : null
      })
      .select()
      .single();

    if (donationError) {
      console.error('Database error:', donationError);
      throw new Error(`Failed to store donation: ${donationError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_session_id: cashfreeData.payment_session_id,
        payment_url: cashfreeData.payment_links?.web || `${cashfreeBaseUrl}/checkout?payment_session_id=${cashfreeData.payment_session_id}`,
        order_id: orderId,
        donation_id: donationData.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-payment-order-universal:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});