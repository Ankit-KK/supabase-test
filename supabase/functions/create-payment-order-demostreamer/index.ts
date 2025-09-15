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
    const requestBody = await req.json();
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const { 
      name, 
      amount, 
      message, 
      phone, 
      streamer_slug, 
      temp_voice_data, 
      voice_duration_seconds, 
      is_hyperemote,
      emotion_tags
    } = requestBody;

    if (!name || !amount) {
      console.error('Missing required fields - name:', name, 'amount:', amount);
      throw new Error('Missing required fields');
    }

    // Validate phone number if provided
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      console.error('Invalid phone number format:', phone);
      throw new Error('Invalid phone number format');
    }

    console.log(`Creating payment order for ${name}: ₹${amount}`);

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get streamer info
    const { data: streamer } = await supabaseAnon
      .rpc('get_public_streamer_data', { p_streamer_slug: 'demostreamer' });

    if (!streamer || streamer.length === 0) {
      throw new Error('Streamer not found');
    }

    const streamerData = streamer[0];
    console.log('Found streamer:', streamerData);

    // Check if this is a hyperemote (either passed explicitly or based on amount)
    const isHyperemoteFlag = is_hyperemote || (
      streamerData.hyperemotes_enabled && 
      amount >= (streamerData.hyperemotes_min_amount || 50)
    );

    // Generate order ID
    const timestamp = Date.now();
    const orderId = `demostreamer_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

    // Get payment gateway credentials
    const clientId = Deno.env.get('XClientId');
    const clientSecret = Deno.env.get('XClientSecret');
    const apiUrl = Deno.env.get('api_url') || 'https://sandbox-api.cashfree.com/pg';

    console.log('Payment gateway credentials check:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      apiUrl
    });

    if (!clientId || !clientSecret) {
      console.error('Missing payment gateway credentials:', { clientId: !!clientId, clientSecret: !!clientSecret });
      throw new Error('Payment gateway not configured');
    }

    // Create Cashfree order
    const cashfreeOrderId = `CF_${orderId}`;
    const orderData = {
      order_id: cashfreeOrderId,
      order_amount: parseFloat(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: `donor_${timestamp}`,
        customer_name: name,
        customer_email: 'donor@example.com',
        customer_phone: phone || '9999999999'
      },
      order_meta: {
        return_url: `${req.headers.get('origin')}/demostreamer?status=success&order_id=${orderId}`,
        notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/demostreamer-payment-webhook`
      },
      order_note: message || 'Demo Streamer Donation'
    };

    const response = await fetch(`${apiUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'x-api-version': '2025-01-01'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cashfree API error:', errorText);
      throw new Error('Failed to create payment order');
    }

    const paymentOrder = await response.json();

    // Store donation in database
    const donationData: any = {
      streamer_id: streamerData.id,
      name,
      amount: parseFloat(amount),
      message,
      order_id: orderId,
      cashfree_order_id: cashfreeOrderId,
      payment_status: 'pending',
      moderation_status: isHyperemoteFlag ? 'auto_approved' : 'pending',
      is_hyperemote: isHyperemoteFlag
    };

    // Add optional fields if provided
    if (temp_voice_data) {
      donationData.temp_voice_data = temp_voice_data;
    }
    if (voice_duration_seconds) {
      donationData.voice_duration_seconds = voice_duration_seconds;
    }
    if (emotion_tags) {
      donationData.emotion_tags = emotion_tags;
    }

    console.log('Inserting donation with data:', donationData);

    const { data: donation, error: insertError } = await supabase
      .from('demostreamer_donations')
      .insert(donationData)
      .select()
      .single();

    if (insertError) {
      console.error('Database error:', insertError);
      throw new Error('Failed to save donation');
    }

    console.log(`Order created successfully: ${orderId}`);

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderId,
        payment_session_id: paymentOrder.payment_session_id,
        cashfreeOrderId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in create-payment-order-demostreamer:', error);
    
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