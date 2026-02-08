import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token, newPassword } = await req.json();

    // Validate inputs
    if (!token || typeof token !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Reset token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return new Response(
        JSON.stringify({ error: 'New password is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (newPassword.length > 128) {
      return new Response(
        JSON.stringify({ error: 'Password is too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Hash the provided token to match against stored hash
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(token));
    const tokenHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Find valid token
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .single();

    if (tokenError || !resetToken) {
      console.log('Invalid or not found reset token');
      return new Response(
        JSON.stringify({ error: 'Invalid or expired reset link. Please request a new one.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token was already used
    if (resetToken.used_at) {
      console.log('Reset token already used');
      return new Response(
        JSON.stringify({ error: 'This reset link has already been used. Please request a new one.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    if (new Date(resetToken.expires_at) < new Date()) {
      console.log('Reset token expired');
      return new Response(
        JSON.stringify({ error: 'This reset link has expired. Please request a new one.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user exists and is active
    const { data: user, error: userError } = await supabase
      .from('auth_users')
      .select('id, email, is_active')
      .eq('id', resetToken.user_id)
      .single();

    if (userError || !user) {
      console.log('User not found for reset token');
      return new Response(
        JSON.stringify({ error: 'Invalid reset link. Please request a new one.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user.is_active) {
      console.log('User account is deactivated');
      return new Response(
        JSON.stringify({ error: 'This account is no longer active.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash new password with bcrypt (12 rounds) - using sync methods to avoid Worker issues in Deno
    const salt = bcrypt.genSaltSync(12);
    const passwordHash = bcrypt.hashSync(newPassword, salt);

    // Update user password and clear any lockouts
    const { error: updateError } = await supabase
      .from('auth_users')
      .update({
        password_hash: passwordHash,
        failed_login_attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update password. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetToken.id);

    // Invalidate all existing sessions for this user (security measure)
    await supabase
      .from('auth_sessions')
      .delete()
      .eq('user_id', user.id);

    console.log('Password reset successful');

    return new Response(
      JSON.stringify({ message: 'Password has been reset successfully. You can now log in with your new password.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Password reset error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
