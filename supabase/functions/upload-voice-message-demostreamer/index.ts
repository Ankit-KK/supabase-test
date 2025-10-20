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
    const { order_id } = await req.json();

    if (!order_id) {
      throw new Error('Missing order_id');
    }

    console.log(`Processing voice message upload for order: ${order_id}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get donation with voice data
    const { data: donation, error: fetchError } = await supabase
      .from('demostreamer_donations')
      .select('*')
      .eq('order_id', order_id)
      .eq('payment_status', 'success')
      .not('temp_voice_data', 'is', null)
      .single();

    if (fetchError || !donation) {
      console.log('No donation found with voice data for order:', order_id);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No donation with voice data found'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found donation with voice data: ${donation.id}`);

    // Convert base64 voice data to blob
    const audioData = donation.temp_voice_data;
    const audioBlob = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));

    // Upload to Supabase storage
    const fileName = `voice_${donation.id}_${Date.now()}.webm`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voice-messages')
      .upload(fileName, audioBlob, {
        contentType: 'audio/webm'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload voice message');
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('voice-messages')
      .getPublicUrl(fileName);

    const voiceMessageUrl = publicUrlData.publicUrl;

    // Update donation with voice message URL and clear temp data
    const { error: updateError } = await supabase
      .from('demostreamer_donations')
      .update({
        voice_message_url: voiceMessageUrl,
        temp_voice_data: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', donation.id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error('Failed to update donation');
    }

    console.log(`Voice message uploaded successfully: ${voiceMessageUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        voice_message_url: voiceMessageUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in upload-voice-message-demostreamer:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});