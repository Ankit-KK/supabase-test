
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
