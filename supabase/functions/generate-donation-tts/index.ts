// Updated: 2025-01-18 - Added emoji-to-text conversion for TTS
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Hash } from "https://deno.land/x/checksum@1.4.0/mod.ts";
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3@3.525.0";

// Import complete emoji data (100% Unicode coverage including newest emojis)
import emojiData from "https://esm.sh/unicode-emoji-json@0.6.0/data-by-emoji.json" with { type: "json" };

// Convert emojis to their readable text names for TTS
// Uses unicode-emoji-json which has 100% Unicode emoji coverage
const convertEmojisToText = (text: string): string => {
  if (!text) return text;
  
  let result = text;
  
  // Sort emojis by length (longest first) to handle compound emojis correctly
  const sortedEmojis = Object.keys(emojiData).sort((a, b) => b.length - a.length);
  
  // Iterate through all known emojis and replace them with their names
  for (const emoji of sortedEmojis) {
    if (result.includes(emoji)) {
      const data = emojiData[emoji as keyof typeof emojiData];
      // Replace emoji with its readable name (e.g., "grinning face")
      result = result.split(emoji).join(` ${data.name} `);
    }
  }
  
  // Handle skin tone modifiers and variation selectors that might remain
  const modifierRegex = /[\u{1F3FB}-\u{1F3FF}]|[\u{200D}]|[\u{FE0F}]|[\u{FE0E}]/gu;
  result = result.replace(modifierRegex, '');
  
  // Clean up extra whitespace
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Permissions-Policy": "autoplay=*, speaker=*",
  "Feature-Policy": "autoplay *; speaker *",
};

// Get client IP from request headers
const getClientIP = (req: Request): string => {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
};

// Initialize R2 client
const getR2Client = () => {
  const accountId = Deno.env.get("R2_ACCOUNT_ID");
  const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials not configured");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

// Pusher client for Deno
class PusherClient {
  private appId: string;
  private key: string;
  private secret: string;
  private cluster: string;

  constructor(appId: string, key: string, secret: string, cluster: string) {
    this.appId = appId;
    this.key = key;
    this.secret = secret;
    this.cluster = cluster;
  }

  async trigger(channel: string, event: string, data: any) {
    const body = JSON.stringify({ name: event, data: JSON.stringify(data), channel });
    const timestamp = Math.floor(Date.now() / 1000);

    // Calculate MD5 hash of body using checksum library
    const hash = new Hash("md5");
    const bodyMd5 = hash.digest(new TextEncoder().encode(body)).hex();

    const authString = `POST\n/apps/${this.appId}/events\nauth_key=${this.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}`;
    const authSignature = await this.hmacSha256(authString, this.secret);

    const url = `https://api-${this.cluster}.pusher.com/apps/${this.appId}/events?auth_key=${this.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}&auth_signature=${authSignature}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pusher trigger failed: ${error}`);
    }

    return response.json();
  }

  private async hmacSha256(message: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);

    const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);

    const signature = await crypto.subtle.sign("HMAC", key, messageData);
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key (for database operations only)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);
    console.log("TTS request from IP:", clientIP);

    // Check rate limit (10 TTS requests per minute)
    const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc("check_rate_limit_v2", {
      p_ip_address: clientIP,
      p_endpoint: "generate-donation-tts",
      p_max_requests: 10,
      p_window_seconds: 60,
    });

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
    }

    if (rateLimitOk === false) {
      console.log("Rate limit exceeded for IP:", clientIP);
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      username,
      amount,
      message,
      donationId,
      streamerId,
      isVoiceAnnouncement,
      isMediaAnnouncement,
      mediaType,
      currency = "INR",
    } = await req.json();

    if (!username || !amount) {
      throw new Error("Username and amount are required");
    }

    if (!donationId || !streamerId) {
      throw new Error("Donation ID and Streamer ID are required for storage");
    }

    const MINIMAX_API_KEY = Deno.env.get("MINIMAX_API_KEY");
    if (!MINIMAX_API_KEY) {
      throw new Error("MINIMAX_API_KEY is not configured");
    }

    // Get R2 configuration
    const bucketName = Deno.env.get("R2_BUCKET_NAME");
    const r2PublicUrl = Deno.env.get("R2_PUBLIC_URL");

    if (!bucketName || !r2PublicUrl) {
      throw new Error("R2 bucket configuration not set");
    }

    // Get streamer slug and TTS configuration
    const { data: streamerData, error: streamerError } = await supabase
      .from("streamers")
      .select("streamer_slug, tts_voice_id, tts_enabled")
      .eq("id", streamerId)
      .single();

    if (streamerError || !streamerData) {
      console.error("Failed to fetch streamer data:", streamerError);
      throw new Error("Streamer not found");
    }

    // Check if TTS is enabled for this streamer
    if (streamerData.tts_enabled === false) {
      console.log("TTS is disabled for streamer:", streamerId);
      return new Response(JSON.stringify({ error: "TTS is disabled for this streamer" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const streamerSlug = streamerData.streamer_slug;
    const DEFAULT_VOICE_ID = "moss_audio_3e9334b7-e32a-11f0-ba34-ee3bcee0a7c9";
    const voiceId = streamerData.tts_voice_id || DEFAULT_VOICE_ID;
    console.log("Processing TTS for streamer:", streamerSlug, "with voice:", voiceId);

    // Determine donation table name based on streamer slug
    const donationTableMap: Record<string, string> = {
      ankit: "ankit_donations",
      chiaa_gaming: "chiaa_gaming_donations",
      looteriya_gaming: "looteriya_gaming_donations",
      sizzors: "sizzors_donations",
      damask_plays: "damask_plays_donations",
      neko_xenpai: "neko_xenpai_donations",
      thunderx: "thunderx_donations",
      sagarujjwalgaming: "sagarujjwalgaming_donations",
      notyourkween: "notyourkween_donations",
      bongflick: "bongflick_donations",
      mriqmaster: "mriqmaster_donations",
      abdevil: "abdevil_donations",
      vipbhai: "vipbhai_donations",
      jhanvoo: "jhanvoo_donations",
      clumsygod: "clumsygod_donations",
      jimmy_gaming: "jimmy_gaming_donations",
    };

    const donationTable = donationTableMap[streamerSlug];
    if (!donationTable) {
      throw new Error(`No donation table configured for streamer: ${streamerSlug}`);
    }

    console.log("Using donation table:", donationTable);

    // Currency spoken names mapping
    const CURRENCY_SPOKEN_NAMES: Record<string, string> = {
      INR: "rupees",
      USD: "dollars",
      EUR: "euros",
      GBP: "pounds",
      AED: "dirhams",
      SGD: "Singapore dollars",
      AUD: "Australian dollars",
      CAD: "Canadian dollars",
      JPY: "yen",
      KRW: "won",
      KWD: "Kuwaiti dinars",
      BHD: "Bahraini dinars",
      OMR: "Omani rials",
      CHF: "Swiss francs",
      NZD: "New Zealand dollars",
      HKD: "Hong Kong dollars",
      SEK: "Swedish kronor",
      NOK: "Norwegian kroner",
      DKK: "Danish kroner",
      MYR: "ringgit",
      THB: "baht",
      PHP: "pesos",
      IDR: "rupiah",
      ZAR: "rand",
      MXN: "pesos",
      BRL: "reais",
      SAR: "riyals",
      QAR: "riyals",
      TRY: "lira",
      RUB: "rubles",
      CNY: "yuan",
    };

    const getSpokenCurrency = (code: string): string => CURRENCY_SPOKEN_NAMES[code] || code;
    const spokenCurrency = getSpokenCurrency(currency);

    // Convert emojis to readable text before TTS
    const ttsReadyMessage = message ? convertEmojisToText(message) : null;
    console.log("Original message:", message);
    console.log("TTS-ready message:", ttsReadyMessage);

    // Format the donation text for TTS
    let donationText: string;

    if (isVoiceAnnouncement) {
      // Voice message announcement: just announce the sender
      donationText = `${username} sent a Voice message`;
    } else if (isMediaAnnouncement) {
      // Media donation announcement: describe what was uploaded
      let mediaDescription = 'an image';
      if (mediaType) {
        if (mediaType.includes('gif')) {
          mediaDescription = 'a GIF';
        } else if (mediaType.startsWith('video')) {
          mediaDescription = 'a video';
        }
      }
      donationText = `${username} donated ${amount} ${spokenCurrency} and sent ${mediaDescription}`;
    } else if (ttsReadyMessage) {
      // Text message with emojis converted to text
      donationText = `${username} donated ${amount} ${spokenCurrency}. ${ttsReadyMessage}`;
    } else {
      // Fallback
      donationText = `${username} donated ${amount} ${spokenCurrency}. Thank you!`;
    }

    console.log("Generating TTS with MiniMax API for:", donationText);

    // Call MiniMax TTS API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    console.log("Calling MiniMax TTS API...");
    const response = await fetch("https://api-uw.minimax.io/v1/t2a_v2", {
      signal: controller.signal,
      method: "POST",
      headers: {
        Authorization: `Bearer ${MINIMAX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "speech-2.6-hd",
        text: donationText,
        stream: false,
        language_boost: "Hindi",
        output_format: "hex",
        voice_setting: {
          voice_id: voiceId,
          speed: 1.1,
          vol: 5,
          pitch: 0,
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format: "mp3",
          channel: 1,
        },
      }),
    });

    clearTimeout(timeoutId);
    console.log("MiniMax API response received:", {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type"),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MiniMax API error details:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        headers: Object.fromEntries(response.headers.entries()),
      });
      throw new Error(`MiniMax API error: ${response.status} - ${errorText}`);
    }

    // Parse response
    const jsonResponse = await response.json();
    console.log("MiniMax response:", {
      hasBaseResp: !!jsonResponse.base_resp,
      statusCode: jsonResponse.base_resp?.status_code,
      hasData: !!jsonResponse.data,
      dataStatus: jsonResponse.data?.status,
    });

    // Check for API errors
    if (jsonResponse.base_resp?.status_code !== 0) {
      throw new Error(`MiniMax API error: ${jsonResponse.base_resp?.status_msg || "Unknown error"}`);
    }

    // Check if synthesis is complete (status === 2)
    if (jsonResponse.data?.status !== 2) {
      throw new Error("TTS synthesis incomplete");
    }

    if (!jsonResponse.data?.audio) {
      throw new Error("No audio data in response");
    }

    // Decode hex string to binary
    const hexAudio = jsonResponse.data.audio;
    console.log("Hex audio length:", hexAudio.length, "characters");

    const binaryAudio = new Uint8Array(hexAudio.match(/.{1,2}/g).map((byte: string) => parseInt(byte, 16)));
    console.log("Binary audio size:", binaryAudio.length, "bytes");

    // Upload to Cloudflare R2 (now as MP3)
    const storagePath = `tts-audio/${streamerId}/${donationId}.mp3`;
    console.log("Uploading to R2:", storagePath);

    // Initialize R2 client
    const r2Client = getR2Client();

    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: storagePath,
        Body: binaryAudio,
        ContentType: "audio/mpeg",
      }),
    );

    console.log("R2 upload successful");

    // Generate public URL
    const publicUrl = `${r2PublicUrl}/${storagePath}`;
    console.log("Public URL:", publicUrl);

    // Update donation record with TTS audio URL
    const { error: updateError } = await supabase
      .from(donationTable)
      .update({ tts_audio_url: publicUrl })
      .eq("id", donationId);

    if (updateError) {
      console.error("Failed to update donation with TTS URL:", updateError);
      // Don't throw - we still have the URL
    }

    console.log("TTS generation and R2 storage successful");

    return new Response(JSON.stringify({ audioUrl: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("TTS generation error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
