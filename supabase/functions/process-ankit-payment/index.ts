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
    const { donationId } = await req.json();

    if (!donationId) {
      throw new Error('Missing donationId');
    }

    console.log(`Processing payment completion for donation ${donationId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get donation details
    const { data: donation, error: fetchError } = await supabase
      .from('ankit_donations')
      .select('*')
      .eq('id', donationId)
      .single();

    if (fetchError || !donation) {
      throw new Error(`Failed to fetch donation: ${fetchError?.message}`);
    }

    console.log(`Found donation: ${donation.name} - ₹${donation.amount} - Message: "${donation.message}"`);

    // Check if this donation has emotions and needs TTS processing
    const hasEmotions = donation.emotion_tags && donation.emotion_tags.length > 0;
    const needsTTS = hasEmotions && donation.message && !donation.tts_audio_url && donation.processing_status !== 'completed';

    if (needsTTS) {
      console.log(`Triggering emotional TTS generation for donation ${donationId}`);
      
      // Trigger TTS generation in the background
      const ttsResponse = await supabase.functions.invoke('generate-emotional-tts', {
        body: {
          donationId: donation.id,
          message: donation.message,
          donorName: donation.name,
          amount: donation.amount
        }
      });

      if (ttsResponse.error) {
        console.error('Failed to generate TTS:', ttsResponse.error);
        
        // Update processing status to failed
        await supabase
          .from('ankit_donations')
          .update({ processing_status: 'failed' })
          .eq('id', donationId);
      } else {
        console.log('TTS generation triggered successfully');
      }
    } else {
      console.log('No TTS processing needed for this donation');
    }

    return new Response(
      JSON.stringify({
        success: true,
        ttsTriggered: needsTTS
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in process-ankit-payment:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});