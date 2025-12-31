import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModerationRequest {
  action: 'approve' | 'reject' | 'hide_message' | 'unhide_message' | 'ban_donor' | 'unban_donor' | 'replay';
  donationId: string;
  donationTable: string;
  streamerId: string;
  moderatorId?: string;
  moderatorTelegramId?: string;
  moderatorName?: string;
  source: 'telegram' | 'dashboard';
  notes?: string;
  banReason?: string;
}

console.log('moderate-donation: function loaded');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const body: ModerationRequest = await req.json();
    const { action, donationId, donationTable, streamerId, moderatorId, moderatorTelegramId, moderatorName, source, notes, banReason } = body;

    console.log('Moderation request:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!action || !donationId || !donationTable || !streamerId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: action, donationId, donationTable, streamerId' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify moderator exists and has permission if moderatorId provided
    if (moderatorId) {
      const { data: moderator, error: modError } = await supabaseAdmin
        .from('streamers_moderators')
        .select('id, role, can_approve, can_reject, can_hide_message, can_ban, can_replay, is_active')
        .eq('id', moderatorId)
        .eq('is_active', true)
        .single();

      if (modError || !moderator) {
        console.error('Moderator not found or inactive:', modError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Moderator not found or inactive' 
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check permission based on action
      const hasPermission = checkPermission(moderator, action);
      if (!hasPermission) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `No permission to perform action: ${action}` 
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Get current donation state
    const { data: donation, error: donError } = await supabaseAdmin
      .from(donationTable)
      .select('*')
      .eq('id', donationId)
      .single();

    if (donError || !donation) {
      console.error('Donation not found:', donError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Donation not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const previousStatus = donation.moderation_status;
    let newStatus = previousStatus;
    let updateData: Record<string, any> = {};

    // Execute the action
    switch (action) {
      case 'approve':
        newStatus = 'approved';
        updateData = {
          moderation_status: 'approved',
          approved_by: moderatorName || 'moderator',
          approved_at: new Date().toISOString()
        };
        break;

      case 'reject':
        newStatus = 'rejected';
        updateData = {
          moderation_status: 'rejected',
          message_visible: false
        };
        break;

      case 'hide_message':
        updateData = { message_visible: false };
        break;

      case 'unhide_message':
        updateData = { message_visible: true };
        break;

      case 'ban_donor':
        // Add to banned_donors table
        const { error: banError } = await supabaseAdmin
          .from('banned_donors')
          .insert({
            streamer_id: streamerId,
            donor_name: donation.name,
            banned_by_moderator_id: moderatorId,
            banned_by_name: moderatorName,
            reason: banReason || 'Banned by moderator',
            is_active: true
          });

        if (banError) {
          console.error('Error banning donor:', banError);
          // Don't fail the whole operation, just log
        }
        
        // Also reject the current donation
        newStatus = 'rejected';
        updateData = {
          moderation_status: 'rejected',
          message_visible: false
        };
        break;

      case 'unban_donor':
        // Mark ban as inactive
        await supabaseAdmin
          .from('banned_donors')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('streamer_id', streamerId)
          .ilike('donor_name', donation.name);
        break;

      case 'replay':
        // Set audio_played_at to null to trigger replay
        updateData = { audio_played_at: null };
        break;

      default:
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Unknown action: ${action}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Update the donation if there are changes
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from(donationTable)
        .update(updateData)
        .eq('id', donationId);

      if (updateError) {
        console.error('Error updating donation:', updateError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Failed to update donation' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Log the moderation action
    const { data: actionLog, error: logError } = await supabaseAdmin
      .from('moderation_actions')
      .insert({
        streamer_id: streamerId,
        moderator_id: moderatorId,
        moderator_telegram_id: moderatorTelegramId,
        moderator_name: moderatorName,
        donation_id: donationId,
        donation_table: donationTable,
        action_type: action,
        action_source: source,
        previous_status: previousStatus,
        new_status: newStatus,
        notes: notes
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Error logging action:', logError);
      // Don't fail, action was already performed
    }

    // Update moderator stats
    if (moderatorId) {
      await supabaseAdmin
        .from('streamers_moderators')
        .update({ 
          last_action_at: new Date().toISOString(),
          total_actions: supabaseAdmin.rpc('increment_total_actions', { mod_id: moderatorId })
        })
        .eq('id', moderatorId);
    }

    console.log(`Moderation action ${action} completed for donation ${donationId}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      donationId,
      previousStatus,
      newStatus,
      actionLogId: actionLog?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in moderate-donation:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function checkPermission(moderator: any, action: string): boolean {
  // Owner has all permissions
  if (moderator.role === 'owner') return true;
  
  // Viewer has no action permissions
  if (moderator.role === 'viewer') return false;
  
  // Check specific permissions for moderator role
  switch (action) {
    case 'approve':
      return moderator.can_approve;
    case 'reject':
      return moderator.can_reject;
    case 'hide_message':
    case 'unhide_message':
      return moderator.can_hide_message;
    case 'ban_donor':
    case 'unban_donor':
      return moderator.can_ban;
    case 'replay':
      return moderator.can_replay;
    default:
      return false;
  }
}
