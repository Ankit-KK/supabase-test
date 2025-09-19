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
    const { streamer_id, new_token, user_email } = await req.json()

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validate input
    if (!streamer_id || !new_token || !user_email) {
      throw new Error('Missing required fields: streamer_id, new_token, user_email')
    }

    console.log('Generating OBS token for streamer:', streamer_id, 'user email:', user_email)

    // Check if user has access to this streamer
    const { data: streamerAccess, error: accessError } = await supabase
      .rpc('get_streamer_by_email', {
        user_email: user_email
      })

    if (accessError) {
      console.error('Error checking streamer access:', accessError)
      throw new Error('Failed to verify streamer access')
    }

    // Get the streamer details to check access
    const { data: streamer, error: streamerError } = await supabase
      .from('streamers')
      .select('streamer_slug')
      .eq('id', streamer_id)
      .single()

    if (streamerError || !streamer) {
      throw new Error('Streamer not found')
    }

    // Check if user has access to this specific streamer
    const hasAccess = streamerAccess?.some((access: any) => 
      access.streamer_slug === streamer.streamer_slug || access.is_admin === true
    )

    if (!hasAccess) {
      throw new Error('Access denied: You do not have permission to generate tokens for this streamer')
    }

    // Deactivate existing active tokens
    await supabase
      .from('obs_tokens')
      .update({ is_active: false })
      .eq('streamer_id', streamer_id)
      .eq('is_active', true)

    // Insert new active token
    const { data: tokenData, error: tokenError } = await supabase
      .from('obs_tokens')
      .insert({
        streamer_id: streamer_id,
        token: new_token,
        is_active: true
      })
      .select()
      .single()

    if (tokenError) {
      console.error('Error creating token:', tokenError)
      throw new Error('Failed to create OBS token')
    }

    console.log('Successfully created OBS token:', tokenData.id)

    return new Response(
      JSON.stringify({
        success: true,
        token: tokenData
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
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})