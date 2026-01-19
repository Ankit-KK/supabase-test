import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3@3.525.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed MIME types and their extensions
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm'
};

// Get client IP from request headers
const getClientIP = (req: Request): string => {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         req.headers.get('cf-connecting-ip') ||
         'unknown';
};

// Initialize R2 client
const getR2Client = () => {
  const accountId = Deno.env.get('R2_ACCOUNT_ID');
  const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
  const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

// Get media type category from MIME type
const getMediaType = (mimeType: string): 'image' | 'gif' | 'video' => {
  if (mimeType === 'image/gif') return 'gif';
  if (mimeType.startsWith('video/')) return 'video';
  return 'image';
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);
    console.log('[Upload Media] Request from IP:', clientIP);

    // Check rate limit (3 uploads per minute)
    const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc('check_rate_limit_v2', {
      p_ip_address: clientIP,
      p_endpoint: 'upload-donation-media',
      p_max_requests: 3,
      p_window_seconds: 60
    });

    if (rateLimitError) {
      console.error('[Upload Media] Rate limit check error:', rateLimitError);
    }

    if (rateLimitOk === false) {
      console.log('[Upload Media] Rate limit exceeded for IP:', clientIP);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many uploads. Please try again later.'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { mediaData, streamerSlug, mimeType, fileName } = await req.json();

    // Validate required fields
    if (!mediaData || !streamerSlug || !mimeType) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Media data, streamer slug, and MIME type are required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate MIME type
    if (!ALLOWED_TYPES[mimeType]) {
      console.log('[Upload Media] Invalid MIME type:', mimeType);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF, MP4, WebM'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate mediaData is a string
    if (typeof mediaData !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid media data format. Expected base64 string.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate base64 format
    if (!/^[A-Za-z0-9+/=]+$/.test(mediaData)) {
      console.log('[Upload Media] Invalid base64 format from IP:', clientIP);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid media data format. Data must be valid base64.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate estimated decoded size (base64 is ~133% of original)
    const estimatedSizeBytes = (mediaData.length * 3) / 4;
    const MAX_SIZE_MB = 10;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    if (estimatedSizeBytes > MAX_SIZE_BYTES) {
      console.log('[Upload Media] File too large:', Math.round(estimatedSizeBytes / 1024 / 1024 * 100) / 100, 'MB from IP:', clientIP);
      return new Response(
        JSON.stringify({
          success: false,
          error: `File too large. Maximum size is ${MAX_SIZE_MB}MB.`
        }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate streamerSlug format to prevent path traversal
    if (!/^[a-zA-Z0-9_-]+$/.test(streamerSlug)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid streamer slug format.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get R2 configuration
    const bucketName = Deno.env.get('R2_BUCKET_NAME');
    const publicUrl = Deno.env.get('R2_PUBLIC_URL');

    if (!bucketName || !publicUrl) {
      throw new Error('R2 bucket configuration not set');
    }

    // Initialize R2 client
    const r2Client = getR2Client();

    // Convert base64 to Uint8Array
    const mediaBytes = Uint8Array.from(atob(mediaData), c => c.charCodeAt(0));

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = ALLOWED_TYPES[mimeType];
    const fileKey = `donation-media/${streamerSlug}_${timestamp}_${random}${extension}`;

    console.log('[Upload Media] Uploading to R2:', fileKey);

    // Upload to R2
    await r2Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: mediaBytes,
      ContentType: mimeType,
    }));

    // Generate public URL
    const mediaUrl = `${publicUrl}/${fileKey}`;
    const mediaType = getMediaType(mimeType);

    console.log('[Upload Media] Upload successful:', mediaUrl, 'Type:', mediaType);

    return new Response(
      JSON.stringify({
        success: true,
        media_url: mediaUrl,
        media_type: mediaType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Upload Media] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
