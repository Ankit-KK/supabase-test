
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
    const fileExt = 'webm';
    const fileName = `voice-${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;
    const filePath = fileName;

    console.log("UPLOAD: Starting voice upload to storage:", { fileName, fileSize: file.size });

    const { data, error } = await supabase.storage
      .from('donation-gifs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
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
      fileName 
    });
    
    return publicUrl;
  } catch (error) {
    console.error("UPLOAD ERROR: Error in uploadVoice:", error);
    return null;
  }
};
