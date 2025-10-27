import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify admin status
    const token = authHeader.replace('Bearer ', '');
    const { data: sessionData } = await supabaseClient.rpc('validate_session_token', { token });
    
    if (!sessionData || sessionData.length === 0) {
      throw new Error('Invalid session');
    }

    const userEmail = sessionData[0].email;
    
    // Check if user is admin
    const { data: adminData, error: adminError } = await supabaseClient
      .from('admin_emails')
      .select('email')
      .eq('email', userEmail.toLowerCase())
      .single();

    if (adminError || !adminData) {
      throw new Error('Unauthorized: Not an admin user');
    }

    const { streamerId, streamerSlug, alertType } = await req.json();

    if (!streamerId || !streamerSlug || !alertType) {
      throw new Error('Missing required parameters');
    }

    // Map streamer slug to donation table
    const tableMap: Record<string, string> = {
      'ankit': 'ankit_donations',
      'chiaa_gaming': 'chiaa_gaming_donations',
      'techgamer': 'techgamer_donations',
      'musicstream': 'musicstream_donations',
      'artcreate': 'artcreate_donations',
      'codelive': 'codelive_donations',
      'demostreamer': 'demostreamer_donations',
      'fitnessflow': 'fitnessflow_donations',
      'demo2': 'demo2_donations',
      'demo3': 'demo3_donations',
      'demo4': 'demo4_donations',
    };

    const tableName = tableMap[streamerSlug];
    if (!tableName) {
      throw new Error(`Unknown streamer slug: ${streamerSlug}`);
    }

    // Prepare test donation data based on alert type
    const timestamp = Date.now();
    let donationData: any = {
      streamer_id: streamerId,
      name: `Test ${alertType.toUpperCase()} User`,
      payment_status: 'success',
      moderation_status: 'auto_approved',
      message_visible: true,
      order_id: `TEST_${alertType.toUpperCase()}_${timestamp}`,
      approved_by: userEmail,
      approved_at: new Date().toISOString(),
    };

    switch (alertType) {
      case 'text':
        donationData.amount = 50;
        donationData.message = 'This is a test text message alert! 🎉';
        donationData.is_hyperemote = false;
        break;
      
      case 'tts':
        donationData.amount = 100;
        donationData.message = 'This is a test TTS message that will be spoken out loud!';
        donationData.tts_audio_url = 'https://example.com/sample-tts.mp3';
        donationData.is_hyperemote = false;
        break;
      
      case 'voice':
        donationData.amount = 200;
        donationData.message = null;
        donationData.voice_message_url = 'https://example.com/sample-voice.mp3';
        donationData.is_hyperemote = false;
        break;
      
      case 'hyperemote':
        donationData.amount = 150;
        donationData.message = 'Celebrating with hyperemotes! 🎊🎉✨';
        donationData.is_hyperemote = true;
        break;
      
      default:
        throw new Error(`Invalid alert type: ${alertType}`);
    }

    // Insert test donation
    const { data: insertedDonation, error: insertError } = await supabaseClient
      .from(tableName)
      .insert(donationData)
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Failed to insert test donation: ${insertError.message}`);
    }

    console.log(`Test ${alertType} alert triggered for ${streamerSlug}:`, insertedDonation.id);

    return new Response(
      JSON.stringify({
        success: true,
        donationId: insertedDonation.id,
        message: `Test ${alertType} alert triggered successfully`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in admin-trigger-alert:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
