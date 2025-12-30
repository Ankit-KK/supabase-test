import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id } = await req.json()

    if (!order_id) {
      throw new Error('Order ID is required')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Cashfree credentials
    const xClientId = Deno.env.get('XClientId')!
    const xClientSecret = Deno.env.get('XClientSecret')!
    const apiUrl = Deno.env.get('api_url')!

    // Get order status from Cashfree
    const cashfreeResponse = await fetch(`${apiUrl}/orders/${order_id}`, {
      method: 'GET',
      headers: {
        'x-client-id': xClientId,
        'x-client-secret': xClientSecret,
        'x-api-version': '2023-08-01'
      }
    })

    if (!cashfreeResponse.ok) {
      throw new Error('Failed to fetch payment status from Cashfree')
    }

    const cashfreeOrder = await cashfreeResponse.json()

    // Get payment transactions
    const transactionsResponse = await fetch(`${apiUrl}/orders/${order_id}/payments`, {
      method: 'GET',
      headers: {
        'x-client-id': xClientId,
        'x-client-secret': xClientSecret,
        'x-api-version': '2023-08-01'
      }
    })

    let getOrderResponse = []
    if (transactionsResponse.ok) {
      getOrderResponse = await transactionsResponse.json()
    }

    // Apply your status determination logic
    let orderStatus
    if (getOrderResponse.filter && getOrderResponse.filter((transaction: any) => transaction.payment_status === "SUCCESS").length > 0) {
      orderStatus = "Success"
    } else if (getOrderResponse.filter && getOrderResponse.filter((transaction: any) => transaction.payment_status === "PENDING").length > 0) {
      orderStatus = "Pending"
    } else {
      orderStatus = "Failure"
    }

    // Update database based on status
    let dbStatus = 'pending'
    let moderationStatus = 'pending'
    
    if (orderStatus === 'Success') {
      dbStatus = 'success'
      moderationStatus = 'auto_approved'
    } else if (orderStatus === 'Failure') {
      dbStatus = 'failed'
    }

    // Determine which table to update based on order_id prefix
    let tableName = 'chiaa_gaming_donations' // default
    if (order_id.startsWith('ankit_')) {
      tableName = 'ankit_donations'
    } else if (order_id.startsWith('damask_plays_')) {
      tableName = 'damask_plays_donations'
    } else if (order_id.startsWith('neko_xenpai_')) {
      tableName = 'neko_xenpai_donations'
    } else if (order_id.startsWith('looteriya_gaming_')) {
      tableName = 'looteriya_gaming_donations'
    } else if (order_id.startsWith('sizzors_')) {
      tableName = 'sizzors_donations'
    } else if (order_id.startsWith('thunderx_')) {
      tableName = 'thunderx_donations'
    }

    // Update the donation record
    const { data: updatedDonation, error: updateError } = await supabase
      .from(tableName)
      .update({ 
        payment_status: dbStatus,
        moderation_status: moderationStatus,
        approved_at: dbStatus === 'success' ? new Date().toISOString() : null,
        approved_by: dbStatus === 'success' ? 'system' : null
      })
      .eq('order_id', order_id)
      .select()
      .single()

    if (updateError) {
      console.error('Database update error:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id,
        status: orderStatus,
        final_status: orderStatus,
        cashfree_status: cashfreeOrder.order_status,
        order_status: cashfreeOrder.order_status,
        payment_amount: cashfreeOrder.order_amount,
        transactions: getOrderResponse,
        payments: getOrderResponse,
        updated_donation: updatedDonation
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})