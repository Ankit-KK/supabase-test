
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting GIF cleanup process...');

    // Find GIFs older than 24 hours that haven't been cleaned up
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: oldGifs, error: fetchError } = await supabase
      .from('donation_gifs')
      .select('*')
      .lt('uploaded_at', twentyFourHoursAgo.toISOString())
      .neq('status', 'deleted');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${oldGifs?.length || 0} old GIFs to clean up`);

    let cleanedCount = 0;
    let errorCount = 0;

    for (const gif of oldGifs || []) {
      try {
        // Extract filename from URL
        const urlParts = gif.gif_url.split('/');
        const fileName = urlParts[urlParts.length - 1];

        // Delete from storage
        const { error: deleteError } = await supabase.storage
          .from('donation-gifs')
          .remove([fileName]);

        if (deleteError) {
          console.error(`Error deleting file ${fileName}:`, deleteError);
          errorCount++;
          continue;
        }

        // Mark as deleted in database
        const { error: updateError } = await supabase
          .from('donation_gifs')
          .update({
            deleted_at: new Date().toISOString(),
            status: 'deleted'
          })
          .eq('id', gif.id);

        if (updateError) {
          console.error(`Error updating gif record ${gif.id}:`, updateError);
          errorCount++;
          continue;
        }

        cleanedCount++;
        console.log(`Successfully cleaned up GIF: ${fileName}`);

      } catch (error) {
        console.error(`Error processing gif ${gif.id}:`, error);
        errorCount++;
      }
    }

    const result = {
      success: true,
      message: `Cleanup completed. Cleaned: ${cleanedCount}, Errors: ${errorCount}`,
      cleanedCount,
      errorCount
    };

    console.log('GIF cleanup process completed:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in cleanup-gifs function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
