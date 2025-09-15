import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { donationId } = await req.json();

    if (!donationId) {
      throw new Error('Missing donationId');
    }

    console.log(`Processing payment completion for donation ${donationId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get donation details
    const { data: donation, error: fetchError } = await supabase
      .from('ankit_donations')
      .select('*')
      .eq('id', donationId)
      .single();

    if (fetchError || !donation) {
      throw new Error(`Failed to fetch donation: ${fetchError?.message}`);
    }

    console.log(`Found donation: ${donation.name} - ₹${donation.amount} - Message: "${donation.message}"`);

    console.log('Payment processing completed successfully');

    return new Response(
      JSON.stringify({
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in process-ankit-payment:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});