import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();
    
    if (!order_id) {
      throw new Error("Order ID is required");
    }

    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the donation record with temp voice data (handle race conditions)
    const { data: donation, error: fetchError } = await supabaseAdmin
      .from('ankit_donations')
      .select('*')
      .eq('order_id', order_id)
      .eq('payment_status', 'success')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !donation) {
      throw new Error(`Donation not found or payment not successful: ${fetchError?.message}`);
    }

    if (!donation.temp_voice_data) {
      console.log('No voice data to upload for order:', order_id);
      return new Response(
        JSON.stringify({ success: true, message: "No voice data to upload" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert base64 back to blob
    const binaryString = atob(donation.temp_voice_data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const audioBlob = new Blob([bytes], { type: 'audio/webm' });
    
    // Upload to voice-messages bucket
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

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('voice-messages')
      .getPublicUrl(fileName);

    // Update donation record with voice URL and clear temp data
    const { error: updateError } = await supabaseAdmin
      .from('ankit_donations')
      .update({ 
        voice_message_url: publicUrl,
        temp_voice_data: null // Clear temp data to save space
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