import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

    if (!telegramBotToken) {
      console.error('TELEGRAM_BOT_TOKEN not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Telegram bot token not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Setting up Telegram webhook...');

    // The webhook URL that Telegram will call
    const webhookUrl = `${supabaseUrl}/functions/v1/telegram-webhook`;
    console.log('Webhook URL:', webhookUrl);

    // Set the webhook
    const setWebhookResponse = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/setWebhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'callback_query']
        }),
      }
    );

    const setWebhookResult = await setWebhookResponse.json();
    console.log('Set webhook result:', setWebhookResult);

    if (!setWebhookResult.ok) {
      console.error('Failed to set webhook:', setWebhookResult);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to set webhook', 
          details: setWebhookResult 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get webhook info to verify
    const getWebhookResponse = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/getWebhookInfo`
    );
    const webhookInfo = await getWebhookResponse.json();
    console.log('Webhook info:', webhookInfo);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook set successfully',
        webhookUrl,
        webhookInfo: webhookInfo.result
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error setting up webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});