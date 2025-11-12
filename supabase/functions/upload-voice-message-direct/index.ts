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
    const { voiceData, streamerSlug } = await req.json()

    if (!voiceData || !streamerSlug) {
      throw new Error('Voice data and streamer slug are required')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Convert base64 to Uint8Array
    const audioData = Uint8Array.from(atob(voiceData), c => c.charCodeAt(0))

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const fileName = `${streamerSlug}_${timestamp}_${random}.webm`

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('voice-messages')
      .upload(fileName, audioData, {
        contentType: 'audio/webm',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Failed to upload voice message: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from('voice-messages')
      .getPublicUrl(fileName)

    console.log('Voice message uploaded successfully:', publicUrl)

    return new Response(
      JSON.stringify({
        success: true,
        voice_message_url: publicUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in upload-voice-message-direct:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
