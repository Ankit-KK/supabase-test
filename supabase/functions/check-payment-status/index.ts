import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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
    const { order_id } = await req.json();

    if (!order_id) {
      throw new Error('Order ID is required');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Checking payment status for order:', order_id);

    // First, get the donation record from our database - check both order_id and cashfree_order_id
    let { data: donationData, error: dbError } = await supabase
      .from('chia_gaming_donations')
      .select('*')
      .eq('order_id', order_id)
      .single();

    // If not found by order_id, try by cashfree_order_id
    if (dbError || !donationData) {
      const { data: cfData } = await supabase
        .from('chia_gaming_donations')
        .select('*')
        .eq('cashfree_order_id', order_id)
        .single();
      
      if (cfData) {
        donationData = cfData;
        dbError = null;
      }
    }

    if (dbError || !donationData) {
      console.error('Database error or donation not found:', dbError);
      // Return the current status from our database if available
      return new Response(JSON.stringify({
        success: true,
        order_id,
        payments: [],
        final_status: 'failure',
        error: 'Donation record not found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get payment gateway credentials
    const clientId = Deno.env.get('XClientId');
    const clientSecret = Deno.env.get('XClientSecret');
    const apiUrl = Deno.env.get('api_url');

    if (!clientId || !clientSecret || !apiUrl) {
      throw new Error('Payment gateway not configured');
    }

    // Use the stored Cashfree order ID for API calls
    let cashfreeOrderId = donationData.cashfree_order_id;
    
    if (!cashfreeOrderId) {
      console.log('No Cashfree order ID found, falling back to custom order ID');
      cashfreeOrderId = order_id;
    }

    console.log('Using Cashfree order ID:', cashfreeOrderId);

    // Check payment status with Cashfree
    const response = await fetch(`${apiUrl}/orders/${cashfreeOrderId}/payments`, {
      method: 'GET',
      headers: {
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'Accept': 'application/json',
        'x-api-version': '2025-01-01'
      }
    });

    let result = [];
    let orderDetails = null;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cashfree API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      // If it's a 404 (order not found), return the status from our database
      if (response.status === 404) {
        console.log('Order not found in Cashfree, returning database status');
        
        // If order not found in Cashfree and status is still pending, mark as failed
        let statusToReturn = donationData.payment_status || 'pending';
        if (statusToReturn === 'pending') {
          statusToReturn = 'failed';
          await supabase
            .from('chia_gaming_donations')
            .update({ payment_status: 'failed' })
            .eq('id', donationData.id);
        }

        // If DB already shows success and moderation is pending, notify moderators here as well
        if (statusToReturn === 'success' && donationData.moderation_status === 'pending' && donationData.streamer_id) {
          try {
            const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
            if (!botToken) {
              console.log('TELEGRAM_BOT_TOKEN not configured, skipping moderator notification');
            } else {
              const { data: moderators, error: modError } = await supabase
                .from('streamers_moderators')
                .select('telegram_user_id, mod_name')
                .eq('streamer_id', donationData.streamer_id)
                .eq('is_active', true);

              if (modError || !moderators || moderators.length === 0) {
                console.log('No active moderators found for streamer:', donationData.streamer_id);
              } else {
                const messageText = `🚨 New Donation Needs Approval! 🚨\n\n` +
                  `💰 Amount: ₹${donationData.amount}\n` +
                  `👤 From: ${donationData.name}\n` +
                  `📅 Time: ${new Date(donationData.created_at).toLocaleString()}\n` +
                  `${donationData.message ? `💬 Message: ${donationData.message}\n` : ''}` +
                  `${donationData.voice_message_url ? `🎵 Has Voice Message\n` : ''}`;

                const keyboard = donationData.voice_message_url ? {
                  inline_keyboard: [
                    [{ text: '🎵 Play Voice', callback_data: `play_${donationData.id}` }],
                    [
                      { text: '✅ Approve', callback_data: `approve_${donationData.id}` },
                      { text: '❌ Reject', callback_data: `reject_${donationData.id}` }
                    ]
                  ]
                } : {
                  inline_keyboard: [[
                    { text: '✅ Approve', callback_data: `approve_${donationData.id}` },
                    { text: '❌ Reject', callback_data: `reject_${donationData.id}` }
                  ]]
                };

                for (const moderator of moderators) {
                  try {
                    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        chat_id: moderator.telegram_user_id,
                        text: messageText,
                        reply_markup: keyboard
                      })
                    });
                  } catch (e) {
                    console.error('Error notifying moderator (404 path):', e);
                  }
                }
              }
            }
          } catch (notifyErr) {
            console.error('Error during moderator notification after DB success (404 path):', notifyErr);
          }
        }
        
        return new Response(JSON.stringify({
          success: true,
          order_id,
          payments: [],
          final_status: statusToReturn,
          order_amount: donationData.amount,
          customer_details: {
            customer_name: donationData.name
          },
          message: donationData.message,
          database_status: statusToReturn
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Payment status check failed: ${response.status} - ${errorText}`);
    }

    result = await response.json();
    console.log('Payment status response:', result);

    // Also get order details
    const orderResponse = await fetch(`${apiUrl}/orders/${cashfreeOrderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'Accept': 'application/json',
        'x-api-version': '2025-01-01'
      }
    });

    if (orderResponse.ok) {
      orderDetails = await orderResponse.json();
    }

    // Determine final status
    let finalStatus = 'failure';
    if (result && result.length > 0) {
      const successfulPayment = result.find((payment: any) => payment.payment_status === "SUCCESS");
      const pendingPayment = result.find((payment: any) => payment.payment_status === "PENDING");
      const cancelledPayment = result.find((payment: any) => payment.payment_status === "CANCELLED");
      const failedPayment = result.find((payment: any) => payment.payment_status === "FAILED");
      
      if (successfulPayment) {
        finalStatus = 'success';
      } else if (pendingPayment) {
        finalStatus = 'pending';
      } else if (cancelledPayment) {
        finalStatus = 'cancelled';
      } else if (failedPayment) {
        finalStatus = 'failed';
      }

      const previousStatus = donationData.payment_status || 'pending';
      // Update our database with the latest status using the correct identifier
      await supabase
        .from('chia_gaming_donations')
        .update({ payment_status: finalStatus })
        .eq('id', donationData.id);

      // If payment just transitioned to success, notify moderators with inline buttons
      if (finalStatus === 'success' && previousStatus !== 'success') {
        try {
          const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
          if (!botToken) {
            console.log('TELEGRAM_BOT_TOKEN not configured, skipping moderator notification');
          } else if (!donationData.streamer_id) {
            console.log('Donation missing streamer_id, skipping moderator notification');
          } else {
            const { data: moderators, error: modError } = await supabase
              .from('streamers_moderators')
              .select('telegram_user_id, mod_name')
              .eq('streamer_id', donationData.streamer_id)
              .eq('is_active', true);

            if (modError || !moderators || moderators.length === 0) {
              console.log('No active moderators found for streamer:', donationData.streamer_id);
            } else {
              const messageText = `🚨 New Donation Needs Approval! 🚨\n\n` +
                `💰 Amount: ₹${donationData.amount}\n` +
                `👤 From: ${donationData.name}\n` +
                `📅 Time: ${new Date(donationData.created_at).toLocaleString()}\n` +
                `${donationData.message ? `💬 Message: ${donationData.message}\n` : ''}` +
                `${donationData.voice_message_url ? `🎵 Has Voice Message\n` : ''}`;

              const keyboard = donationData.voice_message_url ? {
                inline_keyboard: [
                  [{ text: '🎵 Play Voice', callback_data: `play_${donationData.id}` }],
                  [
                    { text: '✅ Approve', callback_data: `approve_${donationData.id}` },
                    { text: '❌ Reject', callback_data: `reject_${donationData.id}` }
                  ]
                ]
              } : {
                inline_keyboard: [[
                  { text: '✅ Approve', callback_data: `approve_${donationData.id}` },
                  { text: '❌ Reject', callback_data: `reject_${donationData.id}` }
                ]]
              };

              for (const moderator of moderators) {
                try {
                  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
                  const payload: any = {
                    chat_id: moderator.telegram_user_id,
                    text: messageText,
                    reply_markup: keyboard
                  };
                  const resp = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                  if (!resp.ok) {
                    const errText = await resp.text();
                    console.error('Error sending Telegram message:', errText);
                  }
                } catch (e) {
                  console.error('Error notifying moderator:', e);
                }
              }
            }
          }
        } catch (notifyErr) {
          console.error('Error during moderator notification after payment success:', notifyErr);
        }
      }
    } else {
      // If no payments found and order exists in database, check current status
      if (donationData.payment_status === 'pending') {
        // Order exists but no payments - likely failed or expired
        finalStatus = 'failed';
        await supabase
          .from('chia_gaming_donations')
          .update({ payment_status: 'failed' })
          .eq('id', donationData.id);
      } else {
        // Use existing database status
        finalStatus = donationData.payment_status;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      order_id,
      payments: result,
      order_details: orderDetails,
      final_status: finalStatus,
      order_amount: orderDetails?.order_amount || donationData.amount,
      customer_details: orderDetails?.customer_details || {
        customer_name: donationData.name
      },
      message: donationData.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in check-payment-status function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});