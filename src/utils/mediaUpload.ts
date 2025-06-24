
import { supabase } from "@/integrations/supabase/client";

export const uploadGif = async (file: File): Promise<string | null> => {
  try {
    const fileExt = 'gif';
    const fileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;
    const filePath = fileName;

    console.log("UPLOAD: Starting GIF upload to storage:", { fileName, fileSize: file.size });

    const { data, error } = await supabase.storage
      .from('donation-gifs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error("UPLOAD ERROR: Error uploading GIF:", error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('donation-gifs')
      .getPublicUrl(filePath);

    console.log("UPLOAD SUCCESS: GIF uploaded successfully:", { 
      publicUrl,
      filePath,
      fileName 
    });
    
    return publicUrl;
  } catch (error) {
    console.error("UPLOAD ERROR: Error in uploadGif:", error);
    return null;
  }
};

export const uploadVoice = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop() || 'webm';
    const fileName = `voice-${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;
    const filePath = fileName;

    console.log("UPLOAD: Starting voice upload to storage:", { 
      fileName, 
      fileSize: file.size,
      fileType: file.type,
      originalName: file.name
    });

    const { data, error } = await supabase.storage
      .from('donation-gifs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'audio/webm'
      });

    if (error) {
      console.error("UPLOAD ERROR: Error uploading voice:", error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('donation-gifs')
      .getPublicUrl(filePath);

    console.log("UPLOAD SUCCESS: Voice uploaded successfully:", { 
      publicUrl,
      filePath,
      fileName,
      fileType: file.type
    });
    
    // Store voice metadata in donation_gifs table for tracking
    try {
      const { error: dbError } = await supabase
        .from('donation_gifs')
        .insert({
          gif_url: publicUrl,
          file_name: fileName,
          file_size: file.size,
          file_type: 'voice',
          status: 'uploaded'
        });

      if (dbError) {
        console.error("UPLOAD: Error storing voice metadata:", dbError);
      } else {
        console.log("UPLOAD: Voice metadata stored successfully");
      }
    } catch (metaError) {
      console.error("UPLOAD: Exception storing voice metadata:", metaError);
    }
    
    return publicUrl;
  } catch (error) {
    console.error("UPLOAD ERROR: Error in uploadVoice:", error);
    return null;
  }
};

// Add a function to clean up old voice recordings (can be called periodically)
export const cleanupOldVoiceRecordings = async (daysOld: number = 7): Promise<void> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    console.log(`CLEANUP: Starting cleanup of voice recordings older than ${daysOld} days`);
    
    // Get old voice recordings that have been displayed
    const { data: oldVoices, error: fetchError } = await supabase
      .from('donation_gifs')
      .select('*')
      .eq('file_type', 'voice')
      .eq('status', 'displayed')
      .lt('displayed_at', cutoffDate.toISOString());

    if (fetchError) {
      console.error("CLEANUP ERROR: Error fetching old voice recordings:", fetchError);
      return;
    }

    if (!oldVoices || oldVoices.length === 0) {
      console.log("CLEANUP: No old voice recordings to clean up");
      return;
    }

    console.log(`CLEANUP: Found ${oldVoices.length} old voice recordings to delete`);

    // Delete files from storage
    for (const voice of oldVoices) {
      try {
        if (voice.file_name) {
          const { error: deleteError } = await supabase.storage
            .from('donation-gifs')
            .remove([voice.file_name]);

          if (deleteError) {
            console.error(`CLEANUP ERROR: Error deleting voice file ${voice.file_name}:`, deleteError);
          } else {
            console.log(`CLEANUP: Voice file deleted successfully: ${voice.file_name}`);
            
            // Mark as deleted in database
            await supabase
              .from('donation_gifs')
              .update({ 
                deleted_at: new Date().toISOString(),
                status: 'deleted'
              })
              .eq('id', voice.id);
          }
        }
      } catch (error) {
        console.error(`CLEANUP ERROR: Exception cleaning up voice ${voice.file_name}:`, error);
      }
    }

    console.log("CLEANUP: Voice recordings cleanup completed");
  } catch (error) {
    console.error("CLEANUP ERROR: Exception in cleanupOldVoiceRecordings:", error);
  }
};
