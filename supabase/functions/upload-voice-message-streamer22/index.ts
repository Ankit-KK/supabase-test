import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { donationId, voiceBlob } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!voiceBlob) {
      throw new Error('No voice data provided');
    }

    const fileName = `${donationId}_${Date.now()}.webm`;
    const voiceBuffer = Uint8Array.from(atob(voiceBlob.split(',')[1]), c => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from('voice-messages')
      .upload(`streamer22/${fileName}`, voiceBuffer, {
        contentType: 'audio/webm',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('voice-messages')
      .getPublicUrl(`streamer22/${fileName}`);

    await supabase
      .from('streamer22_donations')
      .update({ voice_message_url: publicUrl })
      .eq('id', donationId);

    return new Response(
      JSON.stringify({ url: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
