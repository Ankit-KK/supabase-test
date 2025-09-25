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

    // Extract order information from webhook - Cashfree sends data nested under 'data'
    const order_id = webhookData.data?.order?.order_id
    const order_status = webhookData.data?.order?.order_status
    const payment_status = webhookData.data?.payment?.payment_status
    const order_amount = webhookData.data?.order?.order_amount

    if (!order_id) {
      console.error('Webhook data structure:', JSON.stringify(webhookData, null, 2))
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
    const getTableName = (orderId: string) => {
      if (orderId.startsWith('ankit_')) return 'ankit_donations';
      if (orderId.startsWith('musicstream_')) return 'musicstream_donations';
      if (orderId.startsWith('techgamer_')) return 'techgamer_donations';
      if (orderId.startsWith('fitnessflow_')) return 'fitnessflow_donations';
      if (orderId.startsWith('artcreate_')) return 'chia_gaming_donations';
      if (orderId.startsWith('codelive_')) return 'chia_gaming_donations';
      if (orderId.startsWith('demostreamer_')) return 'demostreamer_donations';
      return 'chia_gaming_donations'; // default for chia_gaming
    };
    
    const tableName = getTableName(order_id);

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
        const getVoiceUploadFunction = (orderId: string) => {
          if (orderId.startsWith('ankit_')) return 'upload-voice-message-ankit';
          if (orderId.startsWith('musicstream_')) return 'upload-voice-message-musicstream';
          if (orderId.startsWith('techgamer_')) return 'upload-voice-message-techgamer';
          if (orderId.startsWith('fitnessflow_')) return 'upload-voice-message-fitnessflow';
          if (orderId.startsWith('artcreate_')) return 'upload-voice-message-artcreate';
          if (orderId.startsWith('codelive_')) return 'upload-voice-message-codelive';
          if (orderId.startsWith('demostreamer_')) return 'upload-voice-message-demostreamer';
          return 'upload-voice-message'; // default for chia_gaming
        };
        
        const voiceUploadFunction = getVoiceUploadFunction(order_id);

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
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})