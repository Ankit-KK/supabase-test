
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { adminType, password } = await req.json()

    // Create the auth user with the proper email format
    const email = `${adminType}@hyperchat.local`
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Skip email confirmation for admin users
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the admin_users table has the corresponding entry
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('admin_type', adminType)
      .eq('user_email', email)
      .single()

    if (adminError || !adminData) {
      // If no matching admin record, create one
      const { error: insertError } = await supabaseAdmin
        .from('admin_users')
        .upsert({
          admin_type: adminType,
          user_email: email,
          password_hash: 'managed_by_supabase_auth'
        })

      if (insertError) {
        console.error('Admin user creation error:', insertError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Admin user ${adminType} created successfully`,
        user_id: authUser.user?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Setup admin auth error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
