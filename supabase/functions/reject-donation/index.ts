import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for elevated permissions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    const { data: userData } = await supabaseClient.auth.getUser(token);
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    const { donation_id, reason } = await req.json();

    if (!donation_id) {
      throw new Error('Donation ID is required');
    }

    console.log('Rejecting donation:', donation_id, 'Reason:', reason);

    // Get donation details and verify ownership
    const { data: donation, error: fetchError } = await supabaseAdmin
      .from('chia_gaming_donations')
      .select(`
        *,
        streamers!inner(user_id)
      `)
      .eq('id', donation_id)
      .single();

    if (fetchError) {
      console.error('Error fetching donation:', fetchError);
      throw new Error('Donation not found');
    }

    // Verify user owns this streamer
    if (donation.streamers.user_id !== userData.user.id) {
      throw new Error('Unauthorized: You can only reject donations for your own stream');
    }

    // Update donation status to rejected
    const { error: updateError } = await supabaseAdmin
      .from('chia_gaming_donations')
      .update({
        moderation_status: 'rejected',
        rejected_reason: reason || 'Inappropriate content'
      })
      .eq('id', donation_id);

    if (updateError) {
      console.error('Error updating donation:', updateError);
      throw new Error('Failed to reject donation');
    }

    console.log('Donation rejected successfully:', donation_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Donation rejected successfully',
        donation_id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in reject-donation function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});