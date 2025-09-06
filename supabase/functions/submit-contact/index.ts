
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; object-src 'none';"
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';

    // Check rate limit (5 requests per minute for contact form)
    const { data: rateLimitOk } = await supabaseClient.rpc('check_server_rate_limit', {
      p_ip_address: clientIP,
      p_endpoint: 'submit-contact',
      p_max_requests: 5,
      p_window_minutes: 1
    });

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const body = await req.text();
    
    // Validate request size (max 10KB)
    if (body.length > 10240) {
      await supabaseClient.rpc('log_security_violation', {
        violation_type: 'OVERSIZED_REQUEST',
        details: `Contact form request size: ${body.length} bytes`,
        user_email: null
      });
      return new Response(
        JSON.stringify({ error: 'Request too large' }),
        { 
          status: 413, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { name, email, phone, message } = JSON.parse(body);

    // Enhanced validation
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Name, email, and message are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate input lengths and content
    if (name.length > 100 || email.length > 254 || message.length > 1000) {
      await supabaseClient.rpc('log_security_violation', {
        violation_type: 'INVALID_INPUT_LENGTH',
        details: `Contact form field lengths - name: ${name.length}, email: ${email.length}, message: ${message.length}`
      });
      return new Response(
        JSON.stringify({ error: 'Input validation failed' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check for XSS attempts
    const xssPattern = /<[^>]*>|javascript:|data:|vbscript:/i;
    if (xssPattern.test(name) || xssPattern.test(email) || xssPattern.test(message) || 
        (phone && xssPattern.test(phone))) {
      await supabaseClient.rpc('log_security_violation', {
        violation_type: 'POTENTIAL_XSS_ATTEMPT',
        details: 'Contact form XSS attempt detected'
      });
      return new Response(
        JSON.stringify({ error: 'Invalid input detected' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Insert contact submission into database
    const { data, error } = await supabaseClient
      .from('contact_submissions')
      .insert({
        name,
        email,
        phone: phone || null,
        message,
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to submit contact form' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Contact submission saved:', data)

    return new Response(
      JSON.stringify({ success: true, message: 'Contact form submitted successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
