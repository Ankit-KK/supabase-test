const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const discordLink = Deno.env.get('DISCORD_INVITE_LINK') || '';

  return new Response(JSON.stringify({ url: discordLink }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
