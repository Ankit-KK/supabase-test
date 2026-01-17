import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3@3.525.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Get client IP from request headers
const getClientIP = (req: Request): string => {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         req.headers.get('cf-connecting-ip') ||
         'unknown';
};

// Initialize R2 client
const getR2Client = () => {
  const accountId = Deno.env.get('R2_ACCOUNT_ID')
  const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID')
  const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY')

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured')
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client for rate limiting
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get client IP for rate limiting
    const clientIP = getClientIP(req)
    console.log('Voice upload request from IP:', clientIP)

    // Check rate limit (5 uploads per minute)
    const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc('check_rate_limit_v2', {
      p_ip_address: clientIP,
      p_endpoint: 'upload-voice-message-direct',
      p_max_requests: 5,
      p_window_seconds: 60
    })

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError)
    }

    if (rateLimitOk === false) {
      console.log('Rate limit exceeded for IP:', clientIP)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Too many uploads. Please try again later.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { voiceData, streamerSlug } = await req.json()

    if (!voiceData || !streamerSlug) {
      throw new Error('Voice data and streamer slug are required')
    }

    // Validate voiceData is a string
    if (typeof voiceData !== 'string') {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid voice data format. Expected base64 string.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate estimated decoded size (base64 is ~133% of original)
    const estimatedSizeBytes = (voiceData.length * 3) / 4
    const MAX_VOICE_SIZE_MB = 5
    const MAX_VOICE_SIZE_BYTES = MAX_VOICE_SIZE_MB * 1024 * 1024

    if (estimatedSizeBytes > MAX_VOICE_SIZE_BYTES) {
      console.log('Voice message too large:', Math.round(estimatedSizeBytes / 1024 / 1024 * 100) / 100, 'MB from IP:', clientIP)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Voice message too large. Maximum size is ${MAX_VOICE_SIZE_MB}MB.` 
        }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate base64 format (only allow valid base64 characters)
    if (!/^[A-Za-z0-9+/=]+$/.test(voiceData)) {
      console.log('Invalid base64 format from IP:', clientIP)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid voice data format. Data must be valid base64.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate streamerSlug format to prevent path traversal
    if (!/^[a-zA-Z0-9_-]+$/.test(streamerSlug)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid streamer slug format.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get R2 configuration
    const bucketName = Deno.env.get('R2_BUCKET_NAME')
    const publicUrl = Deno.env.get('R2_PUBLIC_URL')

    if (!bucketName || !publicUrl) {
      throw new Error('R2 bucket configuration not set')
    }

    // Initialize R2 client
    const r2Client = getR2Client()

    // Convert base64 to Uint8Array
    const audioData = Uint8Array.from(atob(voiceData), c => c.charCodeAt(0))

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const fileName = `voice-messages/${streamerSlug}_${timestamp}_${random}.webm`

    console.log('Uploading voice message to R2:', fileName)

    // Upload to R2
    await r2Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: audioData,
      ContentType: 'audio/webm',
    }))

    // Generate public URL
    const voiceMessageUrl = `${publicUrl}/${fileName}`

    console.log('Voice message uploaded successfully to R2:', voiceMessageUrl)

    return new Response(
      JSON.stringify({
        success: true,
        voice_message_url: voiceMessageUrl
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
