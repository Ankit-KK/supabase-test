import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('setup-discord-webhook: loaded');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    const applicationId = Deno.env.get('DISCORD_APPLICATION_ID');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!botToken || !applicationId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Discord bot token or application ID not configured'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // The interactions endpoint URL points to our discord-webhook edge function
    const interactionsEndpointUrl = `${supabaseUrl}/functions/v1/discord-webhook`;

    // Update the Discord application's interactions endpoint URL
    const response = await fetch(`https://discord.com/api/v10/applications/${applicationId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        interactions_endpoint_url: interactionsEndpointUrl
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Discord API error:', response.status, errorText);
      return new Response(JSON.stringify({
        success: false,
        error: `Discord API error: ${response.status} - ${errorText}`
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    console.log('Discord interactions endpoint configured:', interactionsEndpointUrl);

    return new Response(JSON.stringify({
      success: true,
      message: 'Discord interactions endpoint configured successfully',
      endpoint: interactionsEndpointUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in setup-discord-webhook:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
