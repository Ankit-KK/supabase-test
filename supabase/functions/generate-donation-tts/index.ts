import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Permissions-Policy': 'autoplay=*, speaker=*',
  'Feature-Policy': 'autoplay *; speaker *',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, amount, message } = await req.json();

    if (!username || !amount) {
      throw new Error('Username and amount are required');
    }

    const SARVAM_API_KEY = Deno.env.get('SARVAM_API_KEY');
    if (!SARVAM_API_KEY) {
      throw new Error('SARVAM_API_KEY is not configured');
    }

    // Format the donation announcement
    const donationText = message 
      ? `${username} donated ${amount} rupees. ${message}`
      : `${username} donated ${amount} rupees. Thank you!`;

    console.log('Generating TTS with Sarvam AI for:', donationText);

    // Detect Hindi text (Devanagari script)
    const containsHindi = /[\u0900-\u097F]/.test(donationText);
    const targetLanguage = containsHindi ? "hi-IN" : "en-IN";

    console.log('Detected language:', targetLanguage);

    // Call Sarvam AI API
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'API-Subscription-Key': SARVAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: donationText,
        target_language_code: targetLanguage,
        speaker: "manisha",
        pitch: 0,
        pace: 1.1,
        loudness: 1.2,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
        model: "bulbul:v2"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sarvam AI API error:', response.status, errorText);
      throw new Error(`Sarvam AI API error: ${response.status}`);
    }

    // Get audio as array buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64 using chunked approach to avoid stack overflow
    const uint8Array = new Uint8Array(audioBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Audio = btoa(binary);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('TTS generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
