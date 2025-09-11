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
    const { orderId } = await req.json();

    if (!orderId) {
      throw new Error('Missing orderId');
    }

    console.log(`Checking payment status for order: ${orderId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get donation from database
    const { data: donation, error: fetchError } = await supabase
      .from('demostreamer_donations')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (fetchError || !donation) {
      throw new Error('Donation not found');
    }

    // If already successful, return current status
    if (donation.payment_status === 'success') {
      return new Response(
        JSON.stringify({
          success: true,
          status: 'success',
          donation
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check payment status with Cashfree
    const clientId = Deno.env.get('CASHFREE_CLIENT_ID');
    const clientSecret = Deno.env.get('CASHFREE_CLIENT_SECRET');
    const apiUrl = Deno.env.get('CASHFREE_API_URL') || 'https://sandbox-api.cashfree.com/pg';

    if (!clientId || !clientSecret) {
      throw new Error('Payment gateway not configured');
    }

    const response = await fetch(`${apiUrl}/orders/${donation.cashfree_order_id}`, {
      method: 'GET',
      headers: {
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'x-api-version': '2023-08-01'
      }
    });

    if (!response.ok) {
      console.error('Failed to check payment status:', await response.text());
      throw new Error('Failed to verify payment status');
    }

    const paymentData = await response.json();
    const paymentStatus = paymentData.order_status?.toLowerCase();

    console.log(`Payment status for ${orderId}: ${paymentStatus}`);

    // Update database with latest status
    let dbStatus = 'pending';
    if (paymentStatus === 'paid') {
      dbStatus = 'success';
    } else if (['cancelled', 'failed', 'expired'].includes(paymentStatus)) {
      dbStatus = 'failed';
    }

    if (dbStatus !== donation.payment_status) {
      const { error: updateError } = await supabase
        .from('demostreamer_donations')
        .update({ 
          payment_status: dbStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', donation.id);

      if (updateError) {
        console.error('Failed to update payment status:', updateError);
      }

      // If payment successful, trigger post-payment processing
      if (dbStatus === 'success') {
        // Trigger moderator notification if needed
        if (donation.moderation_status === 'pending' && !donation.is_hyperemote) {
          supabase.functions.invoke('notify-moderators-demostreamer', {
            body: { donationId: donation.id }
          }).catch(err => console.error('Failed to notify moderators:', err));
        }

        // Trigger post-payment processing
        supabase.functions.invoke('process-demostreamer-payment', {
          body: { donationId: donation.id }
        }).catch(err => console.error('Failed to process payment:', err));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: dbStatus,
        donation: { ...donation, payment_status: dbStatus }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in check-payment-status-demostreamer:', error);
    
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