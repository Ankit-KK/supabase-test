import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { S3Client, ListObjectsV2Command } from "npm:@aws-sdk/client-s3@3.525.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getR2Client = () => {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID')!,
      secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY')!,
    },
  })
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const r2Client = getR2Client()
    const bucketName = Deno.env.get('R2_BUCKET_NAME')
    const publicUrl = Deno.env.get('R2_PUBLIC_URL')

    if (!bucketName || !publicUrl) {
      throw new Error('R2 configuration missing')
    }

    console.log('Listing hypersounds from R2 bucket:', bucketName)

    const response = await r2Client.send(new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'hypersounds/',
    }))

    const sounds = (response.Contents || [])
      .filter(obj => obj.Key?.endsWith('.mp3'))
      .map(obj => ({
        name: obj.Key!.replace('hypersounds/', ''),
        url: `${publicUrl}/${obj.Key}`,
      }))

    console.log(`Found ${sounds.length} hypersounds`)

    return new Response(JSON.stringify({ sounds }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error listing hypersounds:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
