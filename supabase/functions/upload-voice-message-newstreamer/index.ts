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
    const { donation_id } = await req.json();
    
    if (!donation_id) {
      throw new Error("Donation ID is required");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get donation with temp voice data
    const { data: donation, error: fetchError } = await supabaseAdmin
      .from('newstreamer_donations')
      .select('*')
      .eq('id', donation_id)
      .single();

    if (fetchError || !donation) {
      throw new Error("Donation not found");
    }

    if (!donation.temp_voice_data) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No voice data to process"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      // Decode base64 voice data
      const voiceBuffer = Uint8Array.from(atob(donation.temp_voice_data), c => c.charCodeAt(0));
      
      // Generate unique filename
      const filename = `newstreamer_voice_${donation_id}_${Date.now()}.webm`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('voice-messages')
        .upload(filename, voiceBuffer, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('voice-messages')
        .getPublicUrl(filename);

      // Update donation with voice message URL and clear temp data
      const { error: updateError } = await supabaseAdmin
        .from('newstreamer_donations')
        .update({
          voice_message_url: publicUrl,
          temp_voice_data: null,
          voice_duration_seconds: 10 // Default duration, could be calculated
        })
        .eq('id', donation_id);

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      console.log(`Voice message uploaded successfully for donation ${donation_id}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Voice message uploaded successfully",
          voice_url: publicUrl
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (uploadErr) {
      console.error('Error processing voice upload:', uploadErr);
      
      // Clear temp data even if upload fails
      await supabaseAdmin
        .from('newstreamer_donations')
        .update({ temp_voice_data: null })
        .eq('id', donation_id);

      throw new Error(`Voice processing failed: ${uploadErr.message}`);
    }

  } catch (error) {
    console.error('Error in upload-voice-message-newstreamer:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});