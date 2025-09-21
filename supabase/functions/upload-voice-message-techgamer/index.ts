import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch the donation record
    const { data: donation, error: fetchError } = await supabaseClient
      .from('techgamer_donations')
      .select('*')
      .eq('order_id', order_id)
      .eq('payment_status', 'success')
      .not('temp_voice_data', 'is', null)
      .single()

    if (fetchError || !donation) {
      console.error('Error fetching donation:', fetchError)
      throw new Error('Donation not found or voice data missing')
    }

    // Convert base64 to blob
    const base64Data = donation.temp_voice_data.split(',')[1] || donation.temp_voice_data
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const audioBlob = new Blob([bytes], { type: 'audio/webm' })

    // Upload to Supabase Storage
    const fileName = `${order_id}-${Date.now()}.webm`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('voice-messages')
      .upload(fileName, audioBlob, {
        contentType: 'audio/webm',
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error('Failed to upload voice message')
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('voice-messages')
      .getPublicUrl(fileName)

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL')
    }

    // Update donation record with voice message URL and clear temp data
    const { error: updateError } = await supabaseClient
      .from('techgamer_donations')
      .update({
        voice_message_url: urlData.publicUrl,
        temp_voice_data: null,
      })
      .eq('id', donation.id)

    if (updateError) {
      console.error('Update error:', updateError)
      throw new Error('Failed to update donation record')
    }

    return new Response(
      JSON.stringify({
        success: true,
        voice_message_url: urlData.publicUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in upload-voice-message-techgamer:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})