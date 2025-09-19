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
    const webhookData = await req.json()
    
    console.log('Cashfree webhook received:', JSON.stringify(webhookData, null, 2))

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Extract order information from webhook
    const { order_id, order_status, payment_status, order_amount } = webhookData

    if (!order_id) {
      throw new Error('Order ID not found in webhook data')
    }

    // Determine database status
    let dbStatus = 'pending'
    let moderationStatus = 'pending'
    
    if (order_status === 'PAID' || payment_status === 'SUCCESS') {
      dbStatus = 'success'
      moderationStatus = 'auto_approved'
    } else if (order_status === 'CANCELLED' || order_status === 'TERMINATED' || payment_status === 'FAILED') {
      dbStatus = 'failed'
    }

    // Determine which table to update based on order_id prefix
    let tableName = 'chia_gaming_donations' // default for artcreate, codelive
    if (order_id.startsWith('ankit_')) {
      tableName = 'ankit_donations'
    } else if (order_id.startsWith('demostreamer_')) {
      tableName = 'demostreamer_donations'
    }

    // Update the donation record
    const { data: updatedDonation, error: updateError } = await supabase
      .from(tableName)
      .update({ 
        payment_status: dbStatus,
        moderation_status: moderationStatus,
        approved_at: dbStatus === 'success' ? new Date().toISOString() : null,
        approved_by: dbStatus === 'success' ? 'system' : null,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', order_id)
      .select()
      .single()

    if (updateError) {
      console.error('Database update error:', updateError)
      throw new Error('Failed to update donation record')
    }

    // If payment was successful and there's voice data, trigger voice upload
    if (dbStatus === 'success' && updatedDonation?.temp_voice_data) {
      try {
        let voiceUploadFunction = 'upload-voice-message'
        if (order_id.startsWith('ankit_')) {
          voiceUploadFunction = 'upload-voice-message-ankit'
        } else if (order_id.startsWith('demostreamer_')) {
          voiceUploadFunction = 'upload-voice-message-demostreamer'
        }

        // Trigger voice message upload
        const { error: voiceError } = await supabase.functions.invoke(voiceUploadFunction, {
          body: { order_id }
        })

        if (voiceError) {
          console.error('Voice upload error:', voiceError)
        }
      } catch (voiceError) {
        console.error('Voice upload trigger error:', voiceError)
      }
    }

    console.log(`Payment webhook processed successfully: ${order_id} -> ${dbStatus}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        order_id,
        status: dbStatus,
        updated_donation: updatedDonation
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})