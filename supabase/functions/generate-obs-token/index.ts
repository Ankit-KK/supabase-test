import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-auth-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Origin validation for CSRF protection
function validateOrigin(req: Request): Response | null {
  const origin = req.headers.get('origin')
  if (origin) {
    try {
      const url = new URL(origin)
      if (!url.hostname.endsWith('.lovable.app')) {
        console.warn('[generate-obs-token] Rejected origin:', origin)
        return new Response(
          JSON.stringify({ success: false, error: 'Forbidden: Invalid origin' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: Invalid origin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }
  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // CSRF: Validate origin
    const originError = validateOrigin(req)
    if (originError) return originError
    const { streamer_id, new_token } = await req.json()

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validate input
    if (!streamer_id || !new_token) {
      throw new Error('Missing required fields: streamer_id, new_token')
    }

    // Authentication: require valid session token instead of trusting user_email
    const authToken = req.headers.get('x-auth-token')
    if (!authToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Missing authentication token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { data: sessionData, error: sessionError } = await supabase
      .rpc('validate_session_token', { plain_token: authToken })

    if (sessionError || !sessionData || sessionData.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Invalid or expired session' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const sessionUser = sessionData[0] as any
    const user_email = sessionUser.email
    console.log('Generating OBS token for streamer:', streamer_id, 'by user:', user_email)

    // Check if user has access to this streamer using verified email
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
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})