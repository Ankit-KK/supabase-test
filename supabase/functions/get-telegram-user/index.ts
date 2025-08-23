import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { telegramUsername } = await req.json()

    if (!telegramUsername) {
      return new Response(
        JSON.stringify({ error: 'Telegram username is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!TELEGRAM_BOT_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Telegram bot token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clean username (remove @ if present)
    const cleanUsername = telegramUsername.startsWith('@') ? telegramUsername.slice(1) : telegramUsername

    // Try to get user info from Telegram API
    try {
      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember?chat_id=@${cleanUsername}&user_id=1`,
        { method: 'POST' }
      )

      const telegramData = await telegramResponse.json()

      if (!telegramData.ok) {
        // If we can't get chat member info, the user might not have contacted the bot
        return new Response(
          JSON.stringify({ 
            error: 'User not found or hasn\'t messaged the bot yet',
            details: 'Please ask the user to send /start to the bot first'
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // If we got here, the username exists, but we need a different approach to get user ID
      // For now, we'll return success but recommend manual ID entry
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Username appears valid. Please get the Telegram User ID directly from the user.',
          username: cleanUsername
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (telegramError) {
      console.error('Telegram API error:', telegramError)
      return new Response(
        JSON.stringify({ 
          error: 'Could not verify username with Telegram',
          details: 'Please double-check the username and ensure the user has contacted the bot'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})