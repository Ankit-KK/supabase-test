import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();
    
    if (!order_id) {
      throw new Error("Order ID is required");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: donation, error: fetchError } = await supabaseAdmin
      .from('lofibeats_donations')
      .select('*')
      .eq('order_id', order_id)
      .eq('payment_status', 'success')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !donation) {
      console.error(`Donation fetch error: ${fetchError?.message || 'Unknown error'}`);
      throw new Error(`Donation not found or payment not successful: ${fetchError?.message || 'No donation found'}`);
    }

    if (!donation.temp_voice_data) {
      console.log('No voice data to upload for order:', order_id);
      return new Response(
        JSON.stringify({ success: true, message: "No voice data to upload" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const binaryString = atob(donation.temp_voice_data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const audioBlob = new Blob([bytes], { type: 'audio/webm' });
    
    const fileName = `${order_id}_voice_message.webm`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('voice-messages')
      .upload(fileName, audioBlob, {
        contentType: 'audio/webm',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('voice-messages')
      .getPublicUrl(fileName);

    const { error: updateError } = await supabaseAdmin
      .from('lofibeats_donations')
      .update({ 
        voice_message_url: publicUrl,
        temp_voice_data: null
      })
      .eq('order_id', order_id);

    if (updateError) {
      throw new Error(`Failed to update donation record: ${updateError.message}`);
    }

    console.log('Voice message uploaded successfully for order:', order_id, 'URL:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        voice_message_url: publicUrl,
        message: "Voice message uploaded successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Voice upload error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});