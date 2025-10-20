import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Demo4 voice upload request received');
    
    const { order_id } = await req.json();

    if (!order_id) {
      throw new Error('Order ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: donation, error: fetchError } = await supabase
      .from('demo4_donations')
      .select('*')
      .eq('order_id', order_id)
      .eq('payment_status', 'success')
      .not('temp_voice_data', 'is', null)
      .single();

    if (fetchError || !donation) {
      console.error('Error fetching donation:', fetchError);
      throw new Error('Donation not found or voice data not available');
    }

    console.log('Processing voice upload for donation:', donation.id);

    const base64Data = donation.temp_voice_data.split(',')[1] || donation.temp_voice_data;
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const blob = new Blob([binaryData], { type: 'audio/webm' });

    const filename = `demo4-voice-messages/${donation.id}_${Date.now()}.webm`;

    const { error: uploadError } = await supabase.storage
      .from('voice-messages')
      .upload(filename, blob, {
        contentType: 'audio/webm',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      throw new Error('Failed to upload voice message');
    }

    const { data: urlData } = supabase.storage
      .from('voice-messages')
      .getPublicUrl(filename);

    const voiceMessageUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from('demo4_donations')
      .update({
        voice_message_url: voiceMessageUrl,
        temp_voice_data: null,
      })
      .eq('id', donation.id);

    if (updateError) {
      console.error('Error updating donation:', updateError);
      throw new Error('Failed to update donation with voice URL');
    }

    console.log('Demo4 voice message uploaded successfully:', voiceMessageUrl);

    return new Response(
      JSON.stringify({
        success: true,
        voice_message_url: voiceMessageUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in upload-voice-message-demo4:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
