import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-auth-token",
};

// Origin validation for CSRF protection
const ALLOWED_ORIGINS = [
  'https://hyper-chat.lovable.app',
  'https://id-preview--854a7833-ea4b-49d4-a1e0-c38c31892630.lovable.app',
];

function validateOrigin(req: Request): Response | null {
  const origin = req.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))) {
    return new Response(
      JSON.stringify({ error: 'Forbidden: Invalid origin' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // CSRF: Validate origin
    const originError = validateOrigin(req);
    if (originError) return originError;
    // --- Auth: validate session token (same pattern as other admin edge functions) ---
    const authToken = req.headers.get("x-auth-token");
    if (!authToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: session, error: sessionError } = await supabase.rpc(
      "validate_session_token",
      { plain_token: authToken }
    );

    if (sessionError || !session || session.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = session[0].user_id;

    // --- Parse body ---
    const { voiceUrl, streamerSlug } = await req.json();

    if (!voiceUrl || !streamerSlug) {
      return new Response(
        JSON.stringify({ error: "voiceUrl and streamerSlug are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // --- Access check: user must own this streamer or be admin ---
    const { data: streamer, error: streamerError } = await supabase
      .from("streamers")
      .select("id, user_id")
      .eq("streamer_slug", streamerSlug)
      .single();

    if (streamerError || !streamer) {
      return new Response(JSON.stringify({ error: "Streamer not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check ownership or admin
    const isOwner = !streamer.user_id || streamer.user_id === userId;
    const { data: adminCheck } = await supabase
      .from("admin_emails")
      .select("id")
      .eq("email", session[0].email)
      .maybeSingle();
    const isAdmin = !!adminCheck;

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Download the voice audio ---
    console.log("[transcribe] Downloading voice from:", voiceUrl);
    const audioRes = await fetch(voiceUrl);
    if (!audioRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to download voice audio" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const audioBlob = await audioRes.blob();

    // --- Call Sarvam AI REST API ---
    const sarvamApiKey = Deno.env.get("SARVAM_API_KEY");
    if (!sarvamApiKey) {
      return new Response(
        JSON.stringify({ error: "Sarvam API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model", "saaras:v3");
    formData.append("mode", "transcribe");

    console.log("[transcribe] Calling Sarvam AI...");
    const sarvamRes = await fetch(
      "https://api.sarvam.ai/speech-to-text-translate",
      {
        method: "POST",
        headers: {
          "api-subscription-key": sarvamApiKey,
        },
        body: formData,
      }
    );

    if (!sarvamRes.ok) {
      const errText = await sarvamRes.text();
      console.error("[transcribe] Sarvam API error:", sarvamRes.status, errText);
      return new Response(
        JSON.stringify({
          error: "Transcription failed",
          details: errText,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const sarvamData = await sarvamRes.json();
    console.log("[transcribe] Sarvam response:", JSON.stringify(sarvamData));

    // Sarvam API returns { transcript: "..." } or similar
    const transcript =
      sarvamData.transcript || sarvamData.text || sarvamData.result || "";

    return new Response(JSON.stringify({ transcript }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[transcribe] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
