import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'POST') {
      const { type, table, record } = await req.json();
      
      console.log('Received database event:', { type, table, record });

      // Only process new donations that need review
      if (table === 'chiaa_gaming_donations' && type === 'INSERT' && record.review_status === 'pending') {
        console.log('Processing new pending donation:', record.id);

        // Call Telegram bot to notify moderators
        const telegramBotUrl = `${supabaseUrl.replace('/v1', '')}/functions/v1/telegram-bot/notify`;
        
        const notificationResponse = await fetch(telegramBotUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            donation: record,
            streamer_id: 'chiaa_gaming'
          })
        });

        if (!notificationResponse.ok) {
          console.error('Failed to send Telegram notification:', await notificationResponse.text());
        } else {
          console.log('Telegram notification sent successfully');
        }
      }

      return new Response('Event processed', { headers: corsHeaders });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  } catch (error) {
    console.error('Error processing donation notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});