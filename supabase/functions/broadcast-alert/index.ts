import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory store for active WebSocket connections (shared across functions)
const activeConnections = new Map<string, WebSocket>();

// Function to broadcast alert to WebSocket connections
async function broadcastAlert(streamerSlug: string, donation: any) {
  console.log('🔔 Broadcasting alert for:', streamerSlug, 'Donor:', donation.name);
  
  // Try to send via WebSocket endpoint
  try {
    const wsUrl = `https://${Deno.env.get('SUPABASE_PROJECT_REF')}.supabase.co/functions/v1/obs-alerts-ws`;
    const response = await fetch(`${wsUrl}/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        streamer_slug: streamerSlug,
        donation: donation
      })
    });
    
    if (response.ok) {
      console.log('✅ Alert broadcast successful');
      return true;
    } else {
      console.error('❌ Alert broadcast failed:', response.status, await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ Alert broadcast error:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { streamer_slug, donation } = await req.json();
    
    if (!streamer_slug || !donation) {
      throw new Error("Missing required parameters");
    }

    console.log('📢 Alert broadcast request:', { streamer_slug, donationId: donation.id });
    
    const success = await broadcastAlert(streamer_slug, donation);

    return new Response(
      JSON.stringify({
        success,
        message: success ? "Alert broadcast successful" : "Alert broadcast failed"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error broadcasting alert:', error);
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