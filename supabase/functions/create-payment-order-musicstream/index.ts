import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

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
    const { name, amount, message, voice_blob, streamer_slug } = await req.json();

    // Validate input
    if (!name || !amount || amount <= 0) {
      throw new Error('Invalid donation data: name and amount are required');
    }

    if (!streamer_slug || streamer_slug !== 'musicstream') {
      throw new Error('Invalid streamer slug for this endpoint');
    }

    console.log(`Creating payment order for MusicStream: ${name} - ₹${amount}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get streamer details
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('id, hyperemotes_enabled, hyperemotes_min_amount')
      .eq('streamer_slug', 'musicstream')
      .single();

    if (streamerError || !streamerData) {
      throw new Error('Streamer not found');
    }

    // Check if this should be a hyperemote
    const isHyperemote = streamerData.hyperemotes_enabled && 
                        amount >= (streamerData.hyperemotes_min_amount || 50);

    // Generate unique order ID
    const orderId = `musicstream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Cashfree configuration
    const cashfreeAppId = Deno.env.get('CASHFREE_APP_ID');
    const cashfreeSecretKey = Deno.env.get('CASHFREE_SECRET_KEY');
    const cashfreeBaseUrl = Deno.env.get('CASHFREE_BASE_URL') || 'https://sandbox.cashfree.com/pg';

    if (!cashfreeAppId || !cashfreeSecretKey) {
      throw new Error('Cashfree configuration missing');
    }

    // Create Cashfree order
    const cashfreeOrder = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: `donor_${Date.now()}`,
        customer_name: name,
        customer_email: 'donor@musicstream.com',
        customer_phone: '9999999999'
      },
      order_meta: {
        return_url: `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'supabase.co')}/functions/v1/process-musicstream-payment`,
        notify_url: `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'supabase.co')}/functions/v1/musicstream-payment-webhook`
      }
    };

    console.log('Creating Cashfree order:', cashfreeOrder);

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
    console.log('Cashfree response:', cashfreeData);

    if (!cashfreeResponse.ok) {
      throw new Error(`Cashfree error: ${JSON.stringify(cashfreeData)}`);
    }

    // Store donation in database
    const { data: donationData, error: donationError } = await supabase
      .from('musicstream_donations')
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

    console.log('Donation stored successfully:', donationData.id);

    return new Response(
      JSON.stringify({
        success: true,
        payment_session_id: cashfreeData.payment_session_id,
        payment_url: cashfreeData.payment_links?.web || `${cashfreeBaseUrl}/checkout?payment_session_id=${cashfreeData.payment_session_id}`,
        order_id: orderId,
        donation_id: donationData.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in create-payment-order-musicstream:', error);
    
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