import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Streamer configuration mapping
const STREAMER_CONFIG: Record<string, { table: string; prefix: string }> = {
  'abdevil': { table: 'abdevil_donations', prefix: 'ab_rp_' },
  'ankit': { table: 'ankit_donations', prefix: 'ank_rp_' },
  'bongflick': { table: 'bongflick_donations', prefix: 'bf_rp_' },
  'chiaa_gaming': { table: 'chiaa_gaming_donations', prefix: 'cg_rp_' },
  'clumsygod': { table: 'clumsygod_donations', prefix: 'clg_rp_' },
  'damask_plays': { table: 'damask_plays_donations', prefix: 'dp_rp_' },
  'jhanvoo': { table: 'jhanvoo_donations', prefix: 'jh_rp_' },
  'jimmy_gaming': { table: 'jimmy_gaming_donations', prefix: 'jg_rp_' },
  'looteriya_gaming': { table: 'looteriya_gaming_donations', prefix: 'lg_rp_' },
  'mriqmaster': { table: 'mriqmaster_donations', prefix: 'mi_rp_' },
  'neko_xenpai': { table: 'neko_xenpai_donations', prefix: 'nx_rp_' },
  'notyourkween': { table: 'notyourkween_donations', prefix: 'nyk_rp_' },
  'sagarujjwalgaming': { table: 'sagarujjwalgaming_donations', prefix: 'sug_rp_' },
  'sizzors': { table: 'sizzors_donations', prefix: 'sz_rp_' },
  'thunderx': { table: 'thunderx_donations', prefix: 'tx_rp_' },
  'vipbhai': { table: 'vipbhai_donations', prefix: 'vb_rp_' },
};

// Derive streamer_slug from order_id prefix
const getStreamerFromOrderId = (orderId: string): string | null => {
  // Handle legacy prefixes that differ from standard config
  if (orderId.startsWith('chiagaming_rp_')) return 'chiaa_gaming';
  if (orderId.startsWith('ak_rp_')) return 'ankit'; // Legacy Ankit prefix
  
  for (const [slug, config] of Object.entries(STREAMER_CONFIG)) {
    if (orderId.startsWith(config.prefix)) {
      return slug;
    }
  }
  return null;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Support both order_id and orderId for backwards compatibility
    const orderId = body.order_id || body.orderId;
    // Support explicit streamer_slug or derive from order_id
    let streamerSlug = body.streamer_slug;

    console.log(`[Unified] Checking payment status for order: ${orderId}`);

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Derive streamer from order prefix if not explicitly provided
    if (!streamerSlug) {
      streamerSlug = getStreamerFromOrderId(orderId);
    }

    if (!streamerSlug || !STREAMER_CONFIG[streamerSlug]) {
      console.error(`[Unified] Could not determine streamer for order: ${orderId}`);
      throw new Error('Could not determine streamer from order ID');
    }

    const config = STREAMER_CONFIG[streamerSlug];
    console.log(`[Unified] Determined streamer: ${streamerSlug}, table: ${config.table}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get donation from database
    const { data: donation, error: dbError } = await supabase
      .from(config.table)
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (dbError || !donation) {
      console.error(`[Unified] Donation not found for ${orderId}:`, dbError);
      throw new Error('Donation not found');
    }

    // If already successful, return immediately
    if (donation.payment_status === 'success') {
      console.log(`[Unified] Payment already successful for ${orderId}`);
      return new Response(
        JSON.stringify({
          order_id: orderId,
          final_status: 'SUCCESS',
          payment_status: 'success',
          order_status: 'PAID',
          customer_name: donation.name,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check Razorpay order status
    const razorpayKeyId = Deno.env.get('razorpay-keyid');
    const razorpayKeySecret = Deno.env.get('razorpay-keysecret');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    if (!donation.razorpay_order_id) {
      throw new Error('Razorpay order ID not found');
    }

    // Fetch order details from Razorpay
    const orderResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${donation.razorpay_order_id}`,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        },
      }
    );

    if (!orderResponse.ok) {
      throw new Error('Failed to fetch order from Razorpay');
    }

    const orderData = await orderResponse.json();
    console.log(`[Unified] Razorpay order status for ${orderId}:`, orderData.status);

    // Fetch payment details
    const paymentsResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${donation.razorpay_order_id}/payments`,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        },
      }
    );

    let paymentDetails = null;
    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      if (paymentsData.items && paymentsData.items.length > 0) {
        paymentDetails = paymentsData.items[0];
      }
    }

    // Determine final status
    let final_status = donation.payment_status;
    if (orderData.status === 'paid' && donation.payment_status !== 'success') {
      final_status = 'success';
      
      // Update the database if Razorpay shows paid
      await supabase
        .from(config.table)
        .update({ payment_status: 'success' })
        .eq('id', donation.id);
        
      console.log(`[Unified] Updated payment status to success for ${orderId}`);
    } else if (orderData.status === 'attempted') {
      final_status = 'pending';
    }

    return new Response(
      JSON.stringify({
        order_id: orderId,
        order_status: orderData.status.toUpperCase(),
        final_status: final_status === 'success' ? 'SUCCESS' : 'PENDING',
        payment_status: final_status,
        amount: orderData.amount / 100,
        payment_details: paymentDetails,
        customer_name: donation.name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Unified] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
