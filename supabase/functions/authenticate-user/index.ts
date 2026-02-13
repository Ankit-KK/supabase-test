import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

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

// Get client IP from request headers
const getClientIP = (req: Request): string => {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         req.headers.get('cf-connecting-ip') ||
         'unknown';
};

// Account lockout configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

// Password hashing cost factor (higher = more secure but slower)
const BCRYPT_SALT_ROUNDS = 12;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);
    console.log('Auth request from IP:', clientIP);

    // Check rate limit (5 attempts per minute for auth endpoints)
    const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc('check_rate_limit_v2', {
      p_ip_address: clientIP,
      p_endpoint: 'authenticate-user',
      p_max_requests: 5,
      p_window_seconds: 60
    });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }

    if (rateLimitOk === false) {
      console.log('Rate limit exceeded for IP:', clientIP);
      return new Response(
        JSON.stringify({ error: 'Too many attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, email, password, username }: AuthRequest = await req.json();

    if (action === 'register') {
      // Registration is disabled for public access to prevent unauthorized account creation
      return new Response(
        JSON.stringify({ error: 'Registration is currently disabled. Contact admin for access.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'login') {
      // Get user by email - only select fields needed for authentication
      const { data: user, error: userError } = await supabase
        .from('auth_users')
        .select('id, email, username, role, password_hash, is_active, failed_login_attempts, locked_until')
        .eq('email', email.toLowerCase())
        .single();

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid email or password' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const remainingMinutes = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
        console.log('Account locked for user:', user.email, 'remaining minutes:', remainingMinutes);
        return new Response(
          JSON.stringify({ error: `Account is locked. Try again in ${remainingMinutes} minute(s).` }),
          { status: 423, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if account is active
      if (!user.is_active) {
        return new Response(
          JSON.stringify({ error: 'Account is deactivated' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Secure password verification using bcrypt (sync to avoid Worker issues in Deno)
      // Also handle backward compatibility for existing plaintext passwords
      let passwordValid = false;
      const isBcryptHash = user.password_hash && user.password_hash.startsWith('$2');
      
      if (isBcryptHash) {
        // Modern bcrypt hash - use secure comparison
        passwordValid = bcrypt.compareSync(password, user.password_hash);
      } else {
        // Legacy plaintext password - compare directly then upgrade
        passwordValid = user.password_hash === password;
        
        if (passwordValid) {
          // Upgrade plaintext password to bcrypt hash
          console.log('Upgrading password hash for user');
          const salt = bcrypt.genSaltSync(BCRYPT_SALT_ROUNDS);
          const hashedPassword = bcrypt.hashSync(password, salt);
          
          await supabase
            .from('auth_users')
            .update({ password_hash: hashedPassword })
            .eq('id', user.id);
        }
      }
      
      if (!passwordValid) {
        // Increment failed login attempts
        const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
        const updates: Record<string, unknown> = { failed_login_attempts: newFailedAttempts };

        // Lock account if max attempts reached
        if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
          const lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
          updates.locked_until = lockUntil.toISOString();
          console.log('Locking account for user:', user.email, 'until:', lockUntil);
        }

        await supabase
          .from('auth_users')
          .update(updates)
          .eq('id', user.id);

        const attemptsRemaining = MAX_FAILED_ATTEMPTS - newFailedAttempts;
        const errorMessage = attemptsRemaining > 0 
          ? `Invalid email or password. ${attemptsRemaining} attempt(s) remaining.`
          : `Account locked for ${LOCKOUT_DURATION_MINUTES} minutes due to too many failed attempts.`;

        return new Response(
          JSON.stringify({ error: errorMessage }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Successful login - reset failed attempts and unlock
      await supabase
        .from('auth_users')
        .update({ 
          failed_login_attempts: 0, 
          locked_until: null 
        })
        .eq('id', user.id);

      // Generate new session token
      const { data: sessionToken, error: tokenError } = await supabase
        .rpc('generate_session_token');

      if (tokenError || !sessionToken) {
        console.error('Token generation error:', tokenError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate session token' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create session with hashed token (secure storage)
      // The RPC function handles cleanup of old sessions automatically
      const { error: sessionError } = await supabase
        .rpc('create_session_with_hashed_token', {
          p_user_id: user.id,
          p_plain_token: sessionToken
        });

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        return new Response(
          JSON.stringify({ error: 'Failed to create session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Return user data without sensitive fields (password_hash excluded)
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
