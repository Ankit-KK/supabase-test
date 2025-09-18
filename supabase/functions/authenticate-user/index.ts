import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthRequest {
  action: 'login' | 'register';
  email: string;
  password: string;
  username?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, email, password, username }: AuthRequest = await req.json();

    if (action === 'register') {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('auth_users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existingUser) {
        return new Response(
          JSON.stringify({ error: 'User already exists with this email' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create user with plain password for now (in production, you'd want proper hashing)
      const { data: newUser, error: createError } = await supabase
        .from('auth_users')
        .insert({
          email: email.toLowerCase(),
          password_hash: password, // Simple approach for demo
          username: username || null,
          role: 'user'
        })
        .select()
        .single();

      if (createError) {
        console.error('Create user error:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate session token
      const { data: sessionToken } = await supabase
        .rpc('generate_session_token');

      // Create session
      const { error: sessionError } = await supabase
        .from('auth_sessions')
        .insert({
          user_id: newUser.id,
          token: sessionToken
        });

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        return new Response(
          JSON.stringify({ error: 'Failed to create session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          user: {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
            role: newUser.role
          },
          session: {
            access_token: sessionToken,
            token_type: 'bearer',
            expires_in: 7 * 24 * 60 * 60 // 7 days in seconds
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'login') {
      // Get user by email and check password
      const { data: user, error: userError } = await supabase
        .from('auth_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single();

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid email or password' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Simple password verification (in production, use proper hashing)
      if (user.password_hash !== password) {
        return new Response(
          JSON.stringify({ error: 'Invalid email or password' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate new session token
      const { data: sessionToken } = await supabase
        .rpc('generate_session_token');

      // Clean up old sessions and create new one
      await supabase
        .from('auth_sessions')
        .delete()
        .eq('user_id', user.id);

      const { error: sessionError } = await supabase
        .from('auth_sessions')
        .insert({
          user_id: user.id,
          token: sessionToken
        });

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        return new Response(
          JSON.stringify({ error: 'Failed to create session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role
          },
          session: {
            access_token: sessionToken,
            token_type: 'bearer',
            expires_in: 7 * 24 * 60 * 60 // 7 days in seconds
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Authentication error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});