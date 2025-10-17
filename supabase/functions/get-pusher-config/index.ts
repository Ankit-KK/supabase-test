import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get public Pusher credentials from Supabase secrets
    const pusherKey = Deno.env.get('PUSHER_KEY');
    const pusherCluster = Deno.env.get('PUSHER_CLUSTER');

    if (!pusherKey || !pusherCluster) {
      console.error('Missing Pusher configuration in environment variables');
      throw new Error('Pusher configuration incomplete');
    }

    console.log('Pusher config requested - returning public credentials');

    return new Response(
      JSON.stringify({ 
        key: pusherKey, 
        cluster: pusherCluster 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error fetching Pusher config:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch Pusher configuration'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});