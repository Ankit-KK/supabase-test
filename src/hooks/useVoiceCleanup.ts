
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useVoiceCleanup = () => {
  useEffect(() => {
    const cleanupVoiceMessages = async () => {
      try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago

        console.log('VOICE_CLEANUP: Starting automated voice cleanup');

        // Get voice recordings that should be deleted
        const { data: voicesToDelete, error: fetchError } = await supabase
          .from('donation_gifs')
          .select('*')
          .eq('file_type', 'voice')
          .or(
            `and(status.eq.displayed,last_played_at.lt.${fiveMinutesAgo.toISOString()}),` +
            `and(status.eq.uploaded,uploaded_at.lt.${oneHourAgo.toISOString()})`
          );

        if (fetchError) {
          console.error('VOICE_CLEANUP ERROR: Error fetching voice recordings:', fetchError);
          return;
        }

        if (!voicesToDelete || voicesToDelete.length === 0) {
          console.log('VOICE_CLEANUP: No voice recordings to clean up');
          return;
        }

        console.log(`VOICE_CLEANUP: Found ${voicesToDelete.length} voice recordings to delete`);

        // Delete files from storage and update database
        for (const voice of voicesToDelete) {
          try {
            if (voice.file_name) {
              // Delete from storage
              const { error: deleteError } = await supabase.storage
                .from('donation-gifs')
                .remove([voice.file_name]);

              if (deleteError) {
                console.error(`VOICE_CLEANUP ERROR: Error deleting voice file ${voice.file_name}:`, deleteError);
              } else {
                console.log(`VOICE_CLEANUP: Voice file deleted successfully: ${voice.file_name}`);
                
                // Mark as deleted in donation_gifs table
                await supabase
                  .from('donation_gifs')
                  .update({ 
                    deleted_at: new Date().toISOString(),
                    status: 'deleted'
                  })
                  .eq('id', voice.id);

                // Clear voice_url from chiaa_gaming_donations table if donation_id exists
                if (voice.donation_id) {
                  const { error: updateDonationError } = await supabase
                    .from('chiaa_gaming_donations')
                    .update({ 
                      voice_url: null,
                      voice_file_name: null,
                      voice_file_size: null
                    })
                    .eq('id', voice.donation_id);

                  if (updateDonationError) {
                    console.error(`VOICE_CLEANUP ERROR: Error clearing voice_url for donation ${voice.donation_id}:`, updateDonationError);
                  } else {
                    console.log(`VOICE_CLEANUP: Cleared voice_url for donation ${voice.donation_id}`);
                  }
                }
              }
            }
          } catch (error) {
            console.error(`VOICE_CLEANUP ERROR: Exception cleaning up voice ${voice.file_name}:`, error);
          }
        }

        console.log('VOICE_CLEANUP: Automated cleanup completed');
      } catch (error) {
        console.error('VOICE_CLEANUP ERROR: Exception in automated cleanup:', error);
      }
    };

    // Run cleanup immediately
    cleanupVoiceMessages();

    // Set up interval to run cleanup every 5 minutes
    const cleanupInterval = setInterval(cleanupVoiceMessages, 5 * 60 * 1000);

    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);
};
