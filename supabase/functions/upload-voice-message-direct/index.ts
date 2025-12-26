import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3@3.525.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    const { voiceData, streamerSlug } = await req.json()

    if (!voiceData || !streamerSlug) {
      throw new Error('Voice data and streamer slug are required')
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
