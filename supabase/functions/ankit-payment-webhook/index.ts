import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Ankit payment webhook triggered');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find donations that need TTS processing
    const { data: donations, error } = await supabase
      .from('ankit_donations')
      .select('*')
      .eq('payment_status', 'success')
      .eq('processing_status', 'pending')
      .not('emotion_tags', 'is', null)
      .is('tts_audio_url', null)
      .limit(10);

    if (error || !donations?.length) {
      console.log('No donations need TTS processing');
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let processed = 0;
    
    // Process each donation
    for (const donation of donations) {
      try {
        console.log(`Processing TTS for donation ${donation.id}: ${donation.name}`);
        
        const ttsResponse = await supabase.functions.invoke('generate-emotional-tts', {
          body: {
            donationId: donation.id,
            message: donation.message,
            donorName: donation.name,
            amount: donation.amount
          }
        });

        if (ttsResponse.error) {
          console.error(`TTS failed for ${donation.id}:`, ttsResponse.error);
        } else {
          processed++;
          console.log(`TTS completed for donation ${donation.id}`);
        }
      } catch (e) {
        console.error(`Error processing donation ${donation.id}:`, e);
      }
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});